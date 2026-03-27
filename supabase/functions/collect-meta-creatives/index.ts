// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// collect-meta-creatives — Supabase Edge Function
// Meta Marketing API v25 | March 2026
//
// What this function collects per ad:
//   image_url        → url_1080 from /adimages (high-quality images)
//   video_thumbnail_url → picture from /{video_id} (high-quality video thumb)
//   media_type       → 'image' | 'video' (reliable API field)
//   aspect_ratio     → Calculated from real asset dimensions
//   Super Auto-Discovery → Finds the right Ad Account ID from existing DB data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0';
const BATCH_SIZE = 50;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function metaGet(path: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${GRAPH_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429 || res.status >= 500) {
      const waitMs = attempt * 2000;
      console.warn(`[Meta API] ${res.status} on ${path}, retrying in ${waitMs}ms...`);
      await sleep(waitMs);
      continue;
    }

    const json = await res.json();
    if (json.error) {
      console.error(`[Meta API] Error on ${path}:`, JSON.stringify(json.error));
      return null;
    }
    return json;
  }
  return null;
}

function chunks<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  console.log('[collect-meta-creatives] Starting...');

  const META_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!META_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing META_ACCESS_TOKEN' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Ad Account Discovery ──────────────────────────────────────────────────
  let AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

  if (!AD_ACCOUNT_ID) {
    console.log('[collect-meta-creatives] ID not set — running Super Auto-Discovery...');
    
    // Check DB for an existing ad_id
    const { data: sampleAd } = await supabase
      .from('ad_creatives')
      .select('ad_id')
      .limit(1)
      .maybeSingle();

    if (sampleAd?.ad_id) {
        console.log(`[collect-meta-creatives] Found ad_id ${sampleAd.ad_id} in DB. Asking Meta for account_id...`);
        const adInfo = await metaGet(`/${sampleAd.ad_id}?fields=account_id&access_token=${META_TOKEN}`, META_TOKEN);
        if (adInfo?.account_id) {
            AD_ACCOUNT_ID = `act_${adInfo.account_id}`;
            console.log(`[collect-meta-creatives] Super Discovery Success: ${AD_ACCOUNT_ID}`);
        }
    }

    if (!AD_ACCOUNT_ID) {
        console.log('[collect-meta-creatives] Fallback to /me/adaccounts...');
        const discovery = await metaGet(`/me/adaccounts?fields=id,name&access_token=${META_TOKEN}&limit=1`, META_TOKEN);
        if (discovery?.data?.length) {
            AD_ACCOUNT_ID = discovery.data[0].id;
            console.log(`[collect-meta-creatives] Fallback Success: ${AD_ACCOUNT_ID} (${discovery.data[0].name})`);
        }
    }

    if (!AD_ACCOUNT_ID) {
      return new Response(JSON.stringify({ error: 'Ad account not found.' }), { status: 500 });
    }
  }

  try {
    // 1. Fetch Ads
    const adsFields = 'id,name,adset_id,campaign_id,effective_status,creative{id}';
    let allAds: any[] = [];
    let nextUrl: string | null = `${GRAPH_API_BASE}/${AD_ACCOUNT_ID}/ads?fields=${adsFields}&limit=200&access_token=${META_TOKEN}`;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const json = await res.json();
      if (json.error) break;
      allAds = allAds.concat(json.data || []);
      nextUrl = json.paging?.next || null;
      if (nextUrl) await sleep(300);
    }
    console.log(`[Step 1] Found ${allAds.length} ads in account.`);

    // 2. Fetch Creatives
    const creativeFields = 'id,name,thumbnail_url,image_url,image_hash,video_id,body,title,description,call_to_action_type,object_story_spec,effective_status';
    const creativeDetailsMap = new Map();
    const uniqueCids = [...new Set(allAds.map(ad => ad.creative?.id).filter(Boolean))];

    for (const batch of chunks(uniqueCids, 15)) {
      await Promise.all(batch.map(async (cid) => {
        const data = await metaGet(`/${cid}?fields=${creativeFields}&access_token=${META_TOKEN}`, META_TOKEN);
        if (data) creativeDetailsMap.set(cid, data);
      }));
      await sleep(300);
    }

    // 3. High-res Images (/adimages)
    const allHashes = [...new Set([...creativeDetailsMap.values()].map(c => c.image_hash).filter(Boolean))];
    const imageDataMap = new Map();
    for (const hashBatch of chunks(allHashes, BATCH_SIZE)) {
      const hashParam = encodeURIComponent(JSON.stringify(hashBatch));
      const data = await metaGet(`/${AD_ACCOUNT_ID}/adimages?hashes=${hashParam}&fields=hash,url_1080,width,height&access_token=${META_TOKEN}`, META_TOKEN);
      if (data?.data) {
        for (const img of data.data) {
          if (img.hash) imageDataMap.set(img.hash, { url_1080: img.url_1080, width: img.width, height: img.height });
        }
      }
      await sleep(200);
    }

    // 4. Video High-res Thumbs
    const allVideoIds = [...new Set([...creativeDetailsMap.values()].map(c => c.video_id).filter(Boolean))];
    const videoDataMap = new Map();
    for (const batch of chunks(allVideoIds, 10)) {
      await Promise.all(batch.map(async (vid) => {
        const data = await metaGet(`/${vid}?fields=picture,format&access_token=${META_TOKEN}`, META_TOKEN);
        if (data) {
            let bestW = 0, bestH = 0;
            if (Array.isArray(data.format)) {
                for (const f of data.format) { if ((f.width || 0) > bestW) { bestW = f.width; bestH = f.height; } }
            }
            videoDataMap.set(vid, { picture: data.picture, width: bestW, height: bestH });
        }
      }));
      await sleep(300);
    }

    // 5. Adset names
    const adsetIds = [...new Set(allAds.map(ad => ad.adset_id).filter(Boolean))];
    const adsetMap = new Map();
    for (const batch of chunks(adsetIds, 20)) {
      await Promise.all(batch.map(async (asid) => {
        const data = await metaGet(`/${asid}?fields=id,name&access_token=${META_TOKEN}`, META_TOKEN);
        if (data?.name) adsetMap.set(asid, data.name);
      }));
      await sleep(200);
    }

    // 6. Build Payload
    const upsertRows = allAds.map(ad => {
      const creative = creativeDetailsMap.get(ad.creative?.id);
      const mediaType = creative?.video_id ? 'video' : creative?.image_hash ? 'image' : null;
      
      const imgData = creative?.image_hash ? imageDataMap.get(creative.image_hash) : null;
      const imageUrl = imgData?.url_1080 || null; // STRICT: only 1080px or nothing

      const vidData = creative?.video_id ? videoDataMap.get(creative.video_id) : null;
      const videoThumbnailUrl = vidData?.picture || creative?.thumbnail_url || null;

      let aspectRatio = null;
      if (imgData?.width && imgData?.height) aspectRatio = imgData.width / imgData.height;
      else if (vidData?.width && vidData?.height) aspectRatio = vidData.width / vidData.height;

      let body = creative?.body, title = creative?.title, description = creative?.description;
      if (!body && creative?.object_story_spec) {
        const spec = creative.object_story_spec;
        const linkData = spec.link_data || spec.video_data?.call_to_action?.value || {};
        body = linkData.message || body;
        title = linkData.name || title;
        description = linkData.description || description;
      }

      return {
        ad_id: ad.id,
        ad_name: ad.name,
        adset_name: adsetMap.get(ad.adset_id) || null,
        creative_id: creative?.id || null,
        thumbnail_path: videoThumbnailUrl,
        image_url: imageUrl,
        video_thumbnail_url: videoThumbnailUrl,
        image_hash: creative?.image_hash || null,
        video_id: creative?.video_id || null,
        media_type: mediaType,
        aspect_ratio: aspectRatio,
        body, title, description,
        call_to_action_type: creative?.call_to_action_type || null,
        effective_status: ad.effective_status || creative?.effective_status || null,
        collected_at: new Date().toISOString()
      };
    });

    // 7. Upsert
    let upserted = 0;
    for (const batch of chunks(upsertRows, 100)) {
      const { error } = await supabase.from('ad_creatives').upsert(batch, { onConflict: 'ad_id' });
      if (!error) upserted += batch.length;
      else console.error('[Upsert Error]', error.message);
    }

    return new Response(JSON.stringify({ ok: true, ads_found: allAds.length, upserted }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: any) {
    console.error('[Fatal Error]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
