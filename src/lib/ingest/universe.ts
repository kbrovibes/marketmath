/**
 * S&P 500 universe + GICS classification from Wikipedia (CC BY-SA, weekly fetch).
 */

export type UniverseRow = {
  ticker: string;
  name: string;
  sector: string;
  subIndustry: string;
  cik: string;
};

export async function fetchSp500(): Promise<UniverseRow[]> {
  const res = await fetch(
    "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_S%26P_500_companies&prop=text&format=json&formatversion=2",
    { headers: { "User-Agent": "MarketMathApp/1.0 (k4rthikr@gmail.com)" } }
  );
  if (!res.ok) throw new Error(`Wikipedia: ${res.status}`);
  const data = await res.json();
  const html: string = data.parse.text;

  const tableMatch = html.match(
    /<table[^>]*id="constituents"[\s\S]*?<\/table>/
  );
  if (!tableMatch) throw new Error("constituents table not found");

  const rows: UniverseRow[] = [];
  const trRe = /<tr>([\s\S]*?)<\/tr>/g;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(tableMatch[0])) !== null) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(
      (m) =>
        m[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim()
    );
    if (cells.length < 7 || cells[0] === "Symbol") continue;
    const [symbol, security, sector, subIndustry, , , cik] = cells;
    if (!symbol || !/^\d+$/.test(cik ?? "")) continue;
    rows.push({
      // Yahoo/SEC use dashes where Wikipedia uses dots (BRK.B -> BRK-B)
      ticker: symbol.replace(".", "-"),
      name: security,
      sector,
      subIndustry,
      cik: String(parseInt(cik, 10)),
    });
  }
  if (rows.length < 400) throw new Error(`only parsed ${rows.length} rows`);
  return rows;
}
