// Lumen evidence layer — real research grounding from public APIs:
// NCBI PubMed (E-utilities) + ClinicalTrials.gov v2. No API key needed.

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }
  const name = (body.name || '').trim()
  if (!name) return json({ error: 'name required' }, 400)

  const [pubmed, trials] = await Promise.all([searchPubmed(name), searchTrials(name)])

  let level = 'anecdotal'
  if (trials.count > 0) level = 'clinical'
  else if (pubmed.count > 0) level = 'preclinical'

  return json({ name, level, pubmed, trials }, 200)
}

async function searchPubmed(name) {
  try {
    const term = encodeURIComponent(`${name}`)
    const es = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=3&sort=relevance&term=${term}`,
    ).then((r) => r.json())
    const ids = es.esearchresult?.idlist || []
    const count = Number(es.esearchresult?.count || 0)
    if (!ids.length) return { count, articles: [] }
    const sum = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`,
    ).then((r) => r.json())
    const articles = ids.map((id) => {
      const a = sum.result?.[id] || {}
      return { pmid: id, title: a.title || '', year: (a.pubdate || '').slice(0, 4), url: `https://pubmed.ncbi.nlm.nih.gov/${id}/` }
    })
    return { count, articles }
  } catch {
    return { count: 0, articles: [] }
  }
}

async function searchTrials(name) {
  try {
    const q = encodeURIComponent(name)
    const data = await fetch(
      `https://clinicaltrials.gov/api/v2/studies?query.intr=${q}&pageSize=3&countTotal=true&fields=NCTId,BriefTitle,OverallStatus`,
    ).then((r) => r.json())
    const count = Number(data.totalCount || 0)
    const studies = (data.studies || []).map((s) => {
      const idm = s.protocolSection?.identificationModule || {}
      return { nctId: idm.nctId, title: idm.briefTitle || '', url: `https://clinicaltrials.gov/study/${idm.nctId}` }
    })
    return { count, studies }
  } catch {
    return { count: 0, studies: [] }
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
