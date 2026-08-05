/**
 * Educational content for the Learn section. Every metric documented here
 * corresponds to a field computed in src/lib/metrics.ts; formulas and
 * thresholds must stay in sync with that file.
 */

export type MetricDoc = {
  slug: string;
  name: string;
  category:
    | "Growth"
    | "Profitability"
    | "Returns on capital"
    | "Balance sheet"
    | "Capital returns"
    | "Valuation"
    | "Interpretation";
  oneLiner: string;
  formula: string;
  why: string;
  goodBad: string;
  caveats: string;
};

export const METRIC_CATEGORIES: MetricDoc["category"][] = [
  "Growth",
  "Profitability",
  "Returns on capital",
  "Balance sheet",
  "Capital returns",
  "Valuation",
  "Interpretation",
];

export const METRICS: MetricDoc[] = [
  // ── Growth ────────────────────────────────────────────────────────────────
  {
    slug: "revenue-cagr",
    name: "Revenue CAGR (3y / 5y / 10y)",
    category: "Growth",
    oneLiner:
      "The compound annual growth rate of revenue over roughly the last 3, 5, and 10 fiscal years.",
    formula: "Revenue CAGR = (latest revenue ÷ base-year revenue)^(1 ÷ years) − 1",
    why:
      "Revenue is the top of the funnel: every dollar of profit and cash flow ultimately has to come from a sale. A business that cannot grow revenue must rely on margin expansion or buybacks to grow per-share value, and both of those eventually run out. Comparing the 3-year, 5-year, and 10-year rates also shows whether growth is accelerating or fading — a 10-year rate far above the 3-year rate suggests the best years may be behind the company.",
    goodBad:
      "Above 10% a year is genuine growth for a large company. 4–10% is solid, roughly GDP-plus. Below 4% is slow growth, and a negative rate means the business is shrinking. We anchor the CAGR at the fiscal year closest to the target span, so a '5y' figure may actually cover 4 or 6 years depending on the filing history.",
    caveats:
      "CAGR only looks at two endpoints, so an unusually weak base year or a one-time spike in the latest year can distort it. Acquisitions can buy revenue growth that says nothing about the underlying business. Cyclical companies (energy, semiconductors, autos) can show spectacular or terrible CAGRs depending purely on where the endpoints fall in the cycle — check the year-by-year series before trusting the summary number.",
  },
  {
    slug: "eps-cagr",
    name: "EPS CAGR (5y / 10y)",
    category: "Growth",
    oneLiner:
      "The compound annual growth rate of diluted earnings per share over roughly 5 and 10 years.",
    formula: "EPS CAGR = (latest diluted EPS ÷ base-year diluted EPS)^(1 ÷ years) − 1",
    why:
      "Per-share earnings growth is what a shareholder actually receives from growth. It combines three levers: revenue growth, margin change, and share-count change. A company that grows revenue 5% but shrinks its share count 3% a year can compound EPS near 8–9% — which is why EPS growth can exceed revenue growth for years at well-run businesses. Over long horizons, stock returns track EPS growth plus dividends more closely than anything else.",
    goodBad:
      "Double-digit EPS CAGR sustained over a decade is excellent. Mid-single digits is respectable for a mature company. EPS growing much faster than revenue for many years usually means margin expansion or buybacks — worth knowing which, since buybacks are more repeatable than endless margin gains. We split-adjust historical share counts and EPS so the series is comparable across stock splits.",
    caveats:
      "EPS is an accounting number: one-time charges, tax changes, and write-downs make it noisier than revenue or cash flow. A negative or near-zero base year makes the CAGR meaningless (we return no value when the base is not positive). Companies can also flatter EPS with aggressive buybacks funded by debt — check debt/FCF and share change alongside this number.",
  },
  {
    slug: "fcf-cagr",
    name: "Free cash flow CAGR (5y / 10y)",
    category: "Growth",
    oneLiner:
      "The compound annual growth rate of free cash flow over roughly 5 and 10 years.",
    formula:
      "FCF CAGR = (latest FCF ÷ base-year FCF)^(1 ÷ years) − 1, where FCF = operating cash flow − capital expenditures",
    why:
      "Free cash flow is the cash left after running and maintaining the business — the money actually available for dividends, buybacks, debt paydown, or acquisitions. Earnings can be shaped by accruals and estimates; cash either arrived or it did not. A company whose FCF compounds alongside revenue is converting growth into money for owners. When revenue grows but FCF does not, growth is consuming all the cash it produces.",
    goodBad:
      "FCF growth roughly matching or exceeding revenue growth over 5–10 years is the healthy pattern. Above 10% a year is strong. Persistent divergence — revenue up, FCF flat — deserves investigation into working capital and capex trends.",
    caveats:
      "FCF is lumpier than earnings: a single large capex year or a working-capital swing can move it 30% or more. Endpoint sensitivity is therefore worse than for revenue CAGR. Our FCF subtracts all capex, including growth capex, so heavy investors in future capacity look artificially weak on this measure. The CAGR is undefined when the base year's FCF is zero or negative.",
  },

  // ── Profitability ─────────────────────────────────────────────────────────
  {
    slug: "gross-margin",
    name: "Gross margin",
    category: "Profitability",
    oneLiner:
      "The share of revenue left after the direct cost of producing what was sold.",
    formula: "Gross margin = gross profit ÷ revenue",
    why:
      "Gross margin is the rawest read on pricing power. A company that keeps 60 cents of every revenue dollar before overhead has room to fund R&D, marketing, and mistakes; a company keeping 15 cents has almost none. Stable or rising gross margin over many years is one of the most reliable signs of a durable competitive position, because competitors attack fat margins first.",
    goodBad:
      "Software and branded consumer companies often run 60–90%. Quality industrials and consumer staples sit around 30–50%. Retailers, distributors, and commodity producers can be healthy at 15–30%. The level matters less than the trend within the industry: a gross margin falling several points over a few years suggests eroding pricing power — our margin-compression red flag triggers on a drop of more than 5 points over three years.",
    caveats:
      "Gross margin is not comparable across industries; a 25% grocery margin can support a better business than a 70% margin at a subscale software firm. Some companies classify costs differently (for example, putting delivery or depreciation in cost of revenue versus operating expense), which shifts gross margin without changing economics. Banks and insurers do not report a meaningful gross margin at all.",
  },
  {
    slug: "operating-margin",
    name: "Operating margin",
    category: "Profitability",
    oneLiner:
      "The share of revenue left after all costs of running the business, before interest and taxes.",
    formula: "Operating margin = operating income ÷ revenue",
    why:
      "Operating margin measures the profitability of the business itself, separate from how it is financed or taxed. It captures whether scale is working: as revenue grows, do overhead costs grow slower (operating leverage) or keep pace? A company with high gross margin but thin operating margin is spending its pricing power on sales, marketing, or R&D — which may be fine while growing, but must eventually convert to profit.",
    goodBad:
      "Above 25% is excellent for most industries. 10–25% is solid. Below 10% leaves little cushion for a downturn or a price war. Watch the direction: a growing company whose operating margin expands each year is demonstrating operating leverage; one whose margin shrinks while revenue grows is buying growth.",
    caveats:
      "Operating income can include one-time restructuring charges, impairments, and litigation costs that obscure the underlying run rate. Stock-based compensation is an expense here, but its cash effect appears elsewhere — compare with FCF margin to see both views. Capital-intensive businesses carry heavy depreciation in operating costs, so their margins look thin even when cash generation is fine.",
  },
  {
    slug: "net-margin",
    name: "Net margin",
    category: "Profitability",
    oneLiner: "The share of revenue that ends up as bottom-line profit.",
    formula: "Net margin = net income ÷ revenue",
    why:
      "Net margin is the final score after every cost — operations, interest, and taxes. It feeds directly into earnings per share and into most valuation multiples. Persistently high net margins are hard to sustain without some protection from competition, so a decade of 15%+ margins is itself evidence of a moat. Net margin is also the profitability input in our quality score.",
    goodBad:
      "Above 15% is a high-margin business (worth the full 15 profitability points in our quality score). 8–15% is good. 2–8% is thin, and below 2% means the company earns almost nothing per dollar of sales. As always, compare within an industry: a 4% net margin is normal for a grocer and alarming for a software company.",
    caveats:
      "Net income is the most manipulated line on the income statement: tax one-offs, asset sales, revaluations, and legal settlements all land here. A single year's net margin can mislead badly — look at several years. For companies with large non-cash charges (amortization from acquisitions, for example), FCF margin often gives a truer picture of profitability.",
  },
  {
    slug: "fcf-margin",
    name: "FCF margin",
    category: "Profitability",
    oneLiner:
      "The share of revenue converted into free cash flow after all operating costs and capital spending.",
    formula: "FCF margin = free cash flow ÷ revenue, where FCF = operating cash flow − capex",
    why:
      "FCF margin answers the question net margin cannot: of every dollar of sales, how much cash can the owners actually take out without starving the business? It nets out the accrual judgments in earnings and charges the company for the capital equipment it needs. Companies with high FCF margins are self-funding — they can grow, pay down debt, and return cash without raising money from anyone.",
    goodBad:
      "Above 15% is excellent. 5–15% is healthy for most industries. Near zero or negative means the business consumes cash even while it may report accounting profits. FCF margin close to or above net margin generally indicates high-quality, cash-backed earnings.",
    caveats:
      "A heavy investment year depresses FCF margin even when the spending is building future value — distinguish maintenance capex from growth capex when the gap between OCF and FCF is large. Working-capital swings add noise year to year. Stock-based compensation is added back in operating cash flow, so FCF margin flatters heavy SBC issuers; check SBC/FCF alongside it.",
  },

  // ── Returns on capital ────────────────────────────────────────────────────
  {
    slug: "roe",
    name: "Return on equity (ROE)",
    category: "Returns on capital",
    oneLiner:
      "Net income earned per dollar of shareholders' equity in the latest fiscal year.",
    formula: "ROE = net income ÷ shareholders' equity",
    why:
      "ROE measures how productively the company employs the capital that belongs to its owners. A business that reliably earns 20% on its equity can compound internally at a high rate without needing outside money; one earning 5% destroys value relative to what investors could earn elsewhere. Over long holding periods, the return an investor earns tends to converge toward the business's return on capital, which is why ROE carries 15 of the 100 points in our quality score.",
    goodBad:
      "Above 20% sustained over years is excellent (full quality-score credit). 12–20% is good, 6–12% mediocre, and below 6% suggests capital is not earning its keep. Consistency matters more than any single year.",
    caveats:
      "ROE rises mechanically as equity shrinks, so large buybacks or write-downs can produce spectacular ROE with no change in the business — some heavy repurchasers have tiny or even negative equity, making ROE meaningless. Leverage also inflates ROE: the same operating performance on a more indebted balance sheet shows a higher number. Always read ROE together with debt/equity and cash ROIC, which includes debt in the denominator.",
  },
  {
    slug: "roa",
    name: "Return on assets (ROA)",
    category: "Returns on capital",
    oneLiner: "Net income earned per dollar of total assets.",
    formula: "ROA = net income ÷ total assets",
    why:
      "ROA asks how much profit the whole asset base generates, regardless of whether those assets were funded by equity or debt. Because it cannot be inflated by leverage, it is a useful check on a flattering ROE: if ROE is high but ROA is low, borrowing is doing the work. It also exposes capital intensity — a factory-heavy business needs far more assets per dollar of profit than a software company.",
    goodBad:
      "Above 10% is strong for a non-financial company. 5–10% is decent. Below 5% indicates an asset-heavy or low-margin model. Compare ROE and ROA together: a large gap between them is a direct read on how much leverage the company runs.",
    caveats:
      "Banks and insurers naturally run ROA of 1–2% because their business is holding financial assets — the metric is not comparable to industrial companies. Asset-light companies that lease rather than own, or that expensed their most valuable assets (brands, software, research) years ago, show inflated ROA. Goodwill from acquisitions sits in assets and drags the ratio down even when the acquired operations perform well.",
  },
  {
    slug: "cash-roic",
    name: "Cash ROIC (OCF on invested capital)",
    category: "Returns on capital",
    oneLiner:
      "Operating cash flow generated per dollar of invested capital (equity plus long-term debt).",
    formula: "Cash ROIC = operating cash flow ÷ (shareholders' equity + long-term debt)",
    why:
      "This is our preferred return-on-capital measure because both sides resist manipulation: the numerator is cash actually collected from operations, and the denominator counts all long-term capital regardless of whether it came from shareholders or lenders. A high cash ROIC means each incremental dollar the company retains and reinvests is likely to produce a lot of cash — the engine of long-term compounding. It also cannot be gamed by leverage the way ROE can, since debt sits in the denominator.",
    goodBad:
      "Above 20% is excellent. 10–20% is solid. Below 8–10% the business is earning near or below its likely cost of capital, and growth may create little value. As with all return measures, a stable multi-year record beats one strong year.",
    caveats:
      "Using OCF rather than after-tax operating profit makes the number generous for companies with large depreciation or SBC add-backs — it does not charge for the capex needed to sustain the business. Companies with negative equity after years of buybacks distort the denominator. Financial companies and REITs need different frameworks entirely.",
  },
  {
    slug: "sales-efficiency",
    name: "Sales efficiency (capex per $1 of new revenue)",
    category: "Returns on capital",
    oneLiner:
      "How many dollars of additional property, plant, and equipment the company needed to generate each additional dollar of annual revenue over roughly five years.",
    formula:
      "Sales efficiency = change in net PP&E ÷ change in revenue, measured over a ~5-year window",
    why:
      "Growth is only valuable if it does not consume more capital than it returns. This ratio asks a blunt question: to add a dollar of yearly sales, how much did the company have to bolt onto its fixed-asset base? Businesses that grow with little new physical capital (software, brands, marketplaces) convert growth into free cash flow almost immediately. Businesses that must build a plant for every increment of demand grow with a permanent cash tax attached.",
    goodBad:
      "Below 0.2 (twenty cents of new PP&E per new revenue dollar) is capital-light growth. 0.2–0.5 is moderate. Above 1.0 means each dollar of new revenue required more than a dollar of new fixed assets — acceptable only if the returns on that capital are demonstrably high. A negative value with growing revenue means the company grew while its asset base shrank, the best possible pattern.",
    caveats:
      "The measure only counts PP&E, so acquisitions, capitalized software, and leased assets escape it. It is undefined when revenue declined over the window. A company mid-way through a large build-out (data centers, new factories) looks temporarily inefficient even if the investment pays off later. Compare against the company's own history and direct peers, not across industries.",
  },
  {
    slug: "ppne-to-revenue",
    name: "Capital intensity (PP&E ÷ revenue)",
    category: "Returns on capital",
    oneLiner:
      "How large the fixed-asset base is relative to a year of revenue.",
    formula: "Capital intensity = net property, plant & equipment ÷ revenue",
    why:
      "This is a snapshot of how asset-heavy the business model is. A low ratio means the company produces its revenue with little physical plant, so most incremental profit can flow to owners rather than back into equipment. A high ratio means the business must continually replace and expand expensive assets — depreciation is a real, recurring cash cost, and downturns are more painful when a large fixed base must be fed regardless of demand.",
    goodBad:
      "Below 0.15 is asset-light (most software, services, and branded-goods companies). 0.15–0.5 is moderate. Above 0.5 — utilities, railroads, telecoms, heavy manufacturers, chip fabs — means the balance sheet works as hard as the income statement. High intensity is not automatically bad, but it demands correspondingly durable pricing to earn adequate returns.",
    caveats:
      "The ratio understates true capital intensity for companies that lease assets or outsource manufacturing, and overstates it for companies mid-expansion whose new assets have not yet produced revenue. Old, heavily depreciated assets shrink net PP&E and flatter the ratio even when replacement costs loom. Interpret alongside sales efficiency, which measures the trend rather than the level.",
  },

  // ── Balance sheet ─────────────────────────────────────────────────────────
  {
    slug: "debt-to-equity",
    name: "Debt to equity",
    category: "Balance sheet",
    oneLiner: "Long-term debt relative to shareholders' equity.",
    formula: "Debt/equity = long-term debt ÷ shareholders' equity",
    why:
      "Leverage amplifies everything: a leveraged business grows equity value faster in good times and destroys it faster in bad times. Debt holders are paid first, so the more debt sits ahead of shareholders, the less margin for error the business has when revenue disappoints or rates rise. Knowing the leverage level is a precondition for interpreting ROE, which debt inflates mechanically.",
    goodBad:
      "Below 0.5 is conservative. 0.5–1.5 is normal for mature companies with steady cash flows. Above 2 deserves scrutiny unless cash flows are unusually stable (utilities, consumer staples). The right level depends on business volatility: cyclical businesses should carry little debt precisely because their cash flow cannot be relied upon.",
    caveats:
      "Equity is an accounting residual that buybacks and write-downs can shrink toward or below zero, making the ratio explode or turn meaningless at companies that are actually financially strong. That is why we lean more on debt-to-FCF, which compares debt to cash generation rather than to book value. Our figure uses long-term debt only, so short-term borrowings and lease obligations are not included.",
  },
  {
    slug: "debt-to-fcf",
    name: "Debt to free cash flow",
    category: "Balance sheet",
    oneLiner:
      "How many years of current free cash flow it would take to repay all long-term debt.",
    formula: "Debt/FCF = long-term debt ÷ free cash flow (computed only when FCF is positive)",
    why:
      "This is the most practical solvency measure: debt is repaid with cash, not with book equity, so measuring debt in years of cash flow tells you directly how burdensome it is. A company that could clear its debt from two years of free cash flow retains full flexibility — it can survive a downturn, keep investing, and still return cash. A company needing ten years of FCF is effectively working for its lenders.",
    goodBad:
      "Under 2 years is a fortress balance sheet (full credit in our quality score). 2–4 years is manageable. 4–6 is heavy, and above 5 years triggers our heavy-debt red flag. Companies with no debt at all score best of all — flexibility has option value that never shows up in a single year's returns.",
    caveats:
      "FCF in the denominator makes the ratio volatile: a temporarily depressed FCF year makes leverage look worse than it is, and a bumper year makes it look safer. For cyclicals, compute the ratio against mid-cycle cash flow mentally, not the peak. The ratio is undefined when FCF is negative — which is itself the more important fact.",
  },
  {
    slug: "cash-to-debt",
    name: "Cash to debt",
    category: "Balance sheet",
    oneLiner: "Cash and equivalents relative to long-term debt.",
    formula: "Cash/debt = cash & equivalents ÷ long-term debt",
    why:
      "Gross debt overstates risk when the company holds a large cash pile against it. A ratio above 1 means the company could retire every dollar of long-term debt from cash on hand today — its net debt is zero or negative. That position converts a downturn from an existential threat into a buying opportunity: net-cash companies can repurchase shares, make acquisitions, and keep investing while leveraged competitors retrench.",
    goodBad:
      "Above 1 (more cash than debt) earns 5 points in our quality score and effectively neutralizes leverage concerns. 0.5–1 is comfortable. Below 0.25 means the debt is real and must be serviced from future cash flow — read it together with debt/FCF.",
    caveats:
      "Cash held overseas or earmarked for near-term obligations is less available than it appears. Some companies keep large cash balances while also carrying cheap long-dated debt on purpose — that is a financing choice, not distress. The ratio says nothing about debt maturity: a wall of debt due next year matters far more than the same amount due in 2040.",
  },

  // ── Capital returns ───────────────────────────────────────────────────────
  {
    slug: "dividend-yield",
    name: "Dividend yield",
    category: "Capital returns",
    oneLiner:
      "Cash dividends paid over the latest fiscal year as a percentage of the current market cap.",
    formula: "Dividend yield = dividends paid (latest fiscal year) ÷ market cap",
    why:
      "Dividends are the oldest and most direct form of shareholder return: cash leaves the company and arrives in your account, with no judgment required about reinvestment. A long record of maintained or growing dividends also carries information — managements cut dividends only reluctantly, so a steady payout signals confidence in recurring cash flow. For slow-growing businesses, the dividend is often most of the total return.",
    goodBad:
      "2–4% with a well-covered payout is the healthy range for mature payers. Above 5–6% often signals that the market doubts the dividend's sustainability — check the FCF payout ratio before treating a high yield as a gift. Near zero simply means the company prefers buybacks or reinvestment, which can be equally valid.",
    caveats:
      "We compute yield from cash actually paid in the last fiscal year, not the announced forward rate, so recent dividend changes are not yet reflected. A yield can look attractive purely because the price collapsed — the yield is high because the market expects a cut. Dividends are taxed on receipt in taxable accounts, making buybacks more tax-efficient for many holders.",
  },
  {
    slug: "buyback-yield",
    name: "Buyback yield",
    category: "Capital returns",
    oneLiner:
      "Cash spent repurchasing shares over the latest fiscal year as a percentage of market cap.",
    formula: "Buyback yield = share repurchases (latest fiscal year) ÷ market cap",
    why:
      "Buybacks return cash by shrinking the share count, so each remaining share owns a larger slice of the same business. Unlike dividends they are tax-deferred for continuing holders, and unlike dividends their value depends on price: repurchasing undervalued shares transfers wealth to remaining shareholders, repurchasing overvalued shares destroys it. A consistent buyback yield at reasonable valuations is one of the strongest quiet compounding forces in markets.",
    goodBad:
      "2–5% a year sustained over many years, at sensible prices, is excellent. The key check is whether the share count actually falls (see share count change 5y) — gross buybacks that merely offset stock-compensation issuance return nothing to owners. Buybacks funded by debt at high valuations are the worst version of the tool.",
    caveats:
      "This measures gross repurchases, not the net reduction in shares; companies with heavy SBC can spend billions on buybacks while the share count stays flat. Buyback spending is also the most cyclical form of capital return — many companies buy heavily at market tops and stop at bottoms, exactly backwards. Judge the price sensitivity of the program, not just its size.",
  },
  {
    slug: "shareholder-yield",
    name: "Shareholder yield",
    category: "Capital returns",
    oneLiner:
      "Total cash returned to shareholders — dividends plus buybacks — as a percentage of market cap.",
    formula: "Shareholder yield = dividend yield + buyback yield",
    why:
      "Companies choose different mixes of dividends and buybacks for tax and flexibility reasons, so comparing either alone across companies is misleading. Shareholder yield adds them together into the single number that matters: how much cash, in total, went from the company to its owners last year relative to the price you pay today. It makes an apples-to-apples comparison possible between a dividend payer and a heavy repurchaser, and it can be compared directly against bond yields.",
    goodBad:
      "Above 5% is a substantial return of capital. 2–5% is typical for mature, disciplined companies. A shareholder yield above the 10-year Treasury yield, from a company that can also grow, is a demanding but useful hurdle. Zero is fine for a fast grower with better internal uses for the cash.",
    caveats:
      "The measure includes gross buybacks, so SBC-heavy companies overstate the true return to owners. It also says nothing about sustainability — check the FCF payout ratio: a big shareholder yield funded by borrowing rather than free cash flow is a withdrawal from the balance sheet, not a return on the business. Debt paydown, a third genuine use of owner cash, is not captured here.",
  },
  {
    slug: "payout-ratio-fcf",
    name: "FCF payout ratio",
    category: "Capital returns",
    oneLiner:
      "The share of free cash flow consumed by dividends and buybacks in the latest fiscal year.",
    formula: "FCF payout = (dividends paid + buybacks) ÷ free cash flow",
    why:
      "This is the affordability test for shareholder returns. A company paying out half its free cash flow keeps the other half for debt reduction, acquisitions, or a rainy day; a company paying out 120% is funding its distributions from the balance sheet — cash reserves or new debt — which cannot continue indefinitely. Measuring payout against FCF rather than earnings avoids being fooled by non-cash accounting profits.",
    goodBad:
      "Below 60% leaves comfortable room for the distribution to grow. 60–90% is a mature, fully-distributing profile with little slack. Above 100% triggers our over-distribution red flag: the company returned more than it generated, sustainable only briefly. A low ratio at a growing company usually just means cash is being reinvested at good returns instead.",
    caveats:
      "One depressed FCF year can push the ratio above 100% without any real problem — check whether it is a level or a blip. Companies smooth dividends deliberately, so temporary over-distribution during a bad year can be rational. The ratio is undefined when FCF is negative, which supersedes any payout question.",
  },
  {
    slug: "share-change",
    name: "Share count change (5y)",
    category: "Capital returns",
    oneLiner:
      "The annualized rate of change in diluted shares outstanding over roughly the last five years.",
    formula:
      "Share change = (latest diluted shares ÷ shares ~5 years ago)^(1 ÷ years) − 1; negative means the count is shrinking",
    why:
      "Your ownership stake is a numerator over a denominator, and this metric is the denominator's trajectory. A share count shrinking 2–3% a year silently adds 2–3% to per-share growth in everything — revenue, earnings, dividends — while a count growing 3% a year means the business must grow that much just for your slice to stand still. It is also the honest net measure of buybacks: repurchases minus all issuance from stock compensation and offerings.",
    goodBad:
      "Any sustained negative number is good and earns quality-score credit; −2% to −4% a year reflects a serious, price-disciplined repurchase program. Roughly flat is neutral. Growth above +2% a year triggers our dilution red flag — at that pace shareholders lose over a tenth of their proportional ownership in five years.",
    caveats:
      "We adjust historical share counts for stock splits, so the figure reflects real issuance and retirement, not split mechanics. Share issuance for a large, well-priced acquisition can be rational dilution; issuance to fund routine compensation is a recurring cost. Young companies dilute more as a matter of course — the question is whether the rate declines as the business matures.",
  },
  {
    slug: "sbc-to-fcf",
    name: "SBC to FCF",
    category: "Capital returns",
    oneLiner:
      "Stock-based compensation as a share of free cash flow in the latest fiscal year.",
    formula: "SBC/FCF = stock-based compensation ÷ free cash flow (when FCF is positive)",
    why:
      "Stock compensation is a real expense paid in ownership instead of cash. Because it is added back in the cash-flow statement, reported FCF overstates what accrues to existing shareholders whenever SBC is large: the cash looks free, but part of it was effectively raised by printing new shares. This ratio measures how much of the headline free cash flow is offset by that issuance. It matters most at technology companies, where SBC can quietly consume a third or more of FCF.",
    goodBad:
      "Below 15% of FCF is modest and earns quality-score credit. 15–30% is significant — mentally haircut the FCF yield accordingly. Above 30% triggers our red flag: at that level, buybacks often exist mainly to mop up compensation issuance, and 'free' cash flow materially overstates owner earnings.",
    caveats:
      "SBC expense is a grant-date accounting estimate; the true cost to holders is the shares actually issued, which is why this ratio should be read together with the share-count change. Cutting SBC is not free either — the company would otherwise pay cash salaries, lowering OCF. A high ratio caused by temporarily depressed FCF (denominator) is different from one caused by aggressive granting (numerator).",
  },

  // ── Valuation ─────────────────────────────────────────────────────────────
  {
    slug: "pe",
    name: "Price to earnings (P/E)",
    category: "Valuation",
    oneLiner:
      "Market cap as a multiple of the latest fiscal year's net income.",
    formula: "P/E = market cap ÷ net income (latest fiscal year, when positive)",
    why:
      "The P/E is the common language of valuation: how many dollars you pay for each dollar of current annual profit. Its real content is expectations — a P/E of 30 versus 15 means the market expects roughly twice as much future value from each current earnings dollar, which must come from growth. Flipping it over gives the earnings yield, directly comparable to bond yields. Every multiple is shorthand for a DCF; the P/E is just the most familiar shorthand.",
    goodBad:
      "As a rough map: under 12 prices in stagnation or decline, 12–20 is ordinary expectations for a mature business, 20–35 requires solid growth to justify, and above 35 the price depends heavily on years of strong compounding. A low P/E on a deteriorating business is not cheap, and a high P/E on a great one is not necessarily expensive — the multiple is the start of the question, never the answer.",
    caveats:
      "We use the latest full fiscal year's net income, not trailing twelve months, so the figure lags for companies whose earnings are moving fast. Net income is accounting-sensitive: one-time gains compress the P/E artificially and charges inflate it. The ratio is undefined for loss-makers. For cyclicals, the P/E is lowest at the earnings peak — precisely the most dangerous time to find it attractive.",
  },
  {
    slug: "pfcf",
    name: "Price to free cash flow (P/FCF)",
    category: "Valuation",
    oneLiner:
      "Market cap as a multiple of the latest fiscal year's free cash flow.",
    formula: "P/FCF = market cap ÷ free cash flow (latest fiscal year, when positive)",
    why:
      "This is our preferred headline multiple. Free cash flow is the money actually available to owners after sustaining the business, so P/FCF asks the cleanest version of the valuation question: how many years of distributable cash does the price represent? It resists the accrual distortions that plague P/E — depreciation schedules, write-offs, deferred taxes — because cash either came in or it did not.",
    goodBad:
      "Under 15 is inexpensive for a stable business (a ~6.7% FCF yield). 15–25 is a fair range for quality companies with moderate growth. Above 30 you are paying primarily for the future, and the reverse-DCF implied growth becomes the more useful lens. Compare each company against its own history and its sector median on the screener.",
    caveats:
      "FCF is lumpy: a heavy capex year raises the multiple and a light one lowers it, so a single-year P/FCF can misrepresent a company mid-investment-cycle. SBC add-backs flatter FCF at heavy issuers — cross-check SBC/FCF. Undefined when FCF is negative. As with all price multiples, debt is ignored; two companies at the same P/FCF with very different balance sheets are not equally cheap.",
  },
  {
    slug: "ps",
    name: "Price to sales (P/S)",
    category: "Valuation",
    oneLiner: "Market cap as a multiple of the latest fiscal year's revenue.",
    formula: "P/S = market cap ÷ revenue",
    why:
      "Revenue is the hardest line to fake and always exists, so P/S works when earnings-based multiples fail — loss-making growth companies, cyclicals at a trough, turnarounds. Its meaning depends entirely on margins: paying 2x sales for a business that can earn 25% net margins is paying 8x potential earnings; paying 2x sales for a 3% margin business is paying 67x. P/S is therefore best understood as a bet on future profitability.",
    goodBad:
      "There is no universal threshold — a healthy grocer trades below 0.5x sales while an excellent software company may deserve 8x. The useful comparisons are against the company's own history and against peers with similar margin structures. Multi-year revenue multiples above 10x have historically required extraordinary growth and margins to work out for buyers.",
    caveats:
      "Comparing P/S across different margin profiles is the classic beginner error — the ratio only ranks companies fairly within a peer group. It ignores debt entirely, flattering leveraged companies. For companies with volatile or pass-through revenue (distributors, energy traders), revenue itself is a poor base for valuation.",
  },
  {
    slug: "pb",
    name: "Price to book (P/B)",
    category: "Valuation",
    oneLiner:
      "Market cap as a multiple of the accounting book value of shareholders' equity.",
    formula: "P/B = market cap ÷ shareholders' equity (when equity is positive)",
    why:
      "Book value is the accountants' estimate of net assets — what would notionally remain if assets were sold and liabilities paid. P/B was the original value-investing yardstick, and it remains the most relevant multiple for businesses whose assets are financial and marked near market value: banks, insurers, and asset holders. A price far below book, when the assets are real, offers a margin of safety independent of earnings.",
    goodBad:
      "For financial companies, below 1x book with adequate returns on equity has historically been cheap, and 1–2x normal. For modern asset-light companies the ratio is largely uninformative — great franchises routinely trade at 10x+ book because their true assets (brands, software, networks) are not on the balance sheet. High P/B paired with high, durable ROE is normal, not necessarily expensive.",
    caveats:
      "Decades of buybacks and intangible-heavy accounting have detached book value from economic value at most large companies; some excellent businesses have negative equity, making P/B undefined. Goodwill can prop up book value that impairments later erase. Treat P/B as a specialist tool for financials and asset plays, not a general valuation measure.",
  },
  {
    slug: "earnings-yield",
    name: "Earnings yield",
    category: "Valuation",
    oneLiner:
      "The latest fiscal year's net income as a percentage of market cap — the P/E turned upside down.",
    formula: "Earnings yield = net income ÷ market cap",
    why:
      "Expressing valuation as a yield instead of a multiple lets you compare a stock directly against bonds and cash: a 6% earnings yield versus a 4% Treasury yield tells you what extra compensation you are getting for equity risk — before any growth. Growth is the equity holder's edge: the bond coupon is fixed, while a good business's earnings rise over time. Yields also add and compare more intuitively than multiples.",
    goodBad:
      "An earnings yield meaningfully above the 10-year Treasury yield (say 6%+ when Treasuries pay 4%) prices in modest expectations; a yield below the Treasury rate means you are relying on growth to catch up. Under 3% (P/E above ~33) leaves little room for disappointment.",
    caveats:
      "All the caveats of the P/E apply in mirror image: accounting noise in net income, the lag from using the latest fiscal year, and peak-cycle traps at cyclicals. The comparison with bond yields is inexact — earnings are variable and reinvested, coupons are contractual — so treat the spread as orientation, not arithmetic.",
  },
  {
    slug: "fcf-yield",
    name: "FCF yield",
    category: "Valuation",
    oneLiner:
      "Free cash flow as a percentage of market cap — the cash return the business generates at today's price.",
    formula: "FCF yield = free cash flow ÷ market cap",
    why:
      "If you owned the whole company at today's price, the FCF yield is the cash rate the business would pay you after sustaining itself — before any growth. That makes it the single most direct valuation number on the site: comparable across companies, comparable to bond yields, and grounded in cash rather than accounting profit. Total expected return can be roughly framed as FCF yield plus long-run FCF growth.",
    goodBad:
      "Above 5% is cheap for a stable business — you are being paid a bond-beating cash rate with growth as a bonus. 3–5% is fair for quality with moderate growth. Under 2% means you are paying almost entirely for future growth, and the burden of proof shifts to the growth evidence.",
    caveats:
      "A single year of FCF drives the number, so capex timing and working-capital swings distort it — glance at the multi-year FCF series. SBC add-backs inflate FCF at heavy issuers; haircut mentally using SBC/FCF. Market cap ignores debt: a leveraged company's FCF partly belongs to its lenders' refinancing risk, which is why we also compute OCF yield on enterprise value.",
  },
  {
    slug: "ocf-yield-ev",
    name: "OCF yield on enterprise value",
    category: "Valuation",
    oneLiner:
      "Operating cash flow as a percentage of enterprise value (market cap plus debt minus cash).",
    formula:
      "OCF/EV = operating cash flow ÷ (market cap + long-term debt − cash)",
    why:
      "Enterprise value is the price of the whole business — what it would cost to buy every share and settle the net debt. Yielding operating cash flow against EV therefore compares companies fairly regardless of how they are financed: a debt-heavy and a cash-rich company at the same market cap are very different purchases, and EV captures that. This is the acquirer's-eye view of valuation, useful for ranking across capital structures.",
    goodBad:
      "Above 8% is inexpensive — the whole enterprise is generating cash at a rate well above bond yields. 5–8% is reasonable for quality. Below 4% (EV above ~25x OCF) prices in substantial growth. Because OCF sits above capex, compare capital-intensive companies with extra care: their OCF overstates distributable cash more than an asset-light company's does.",
    caveats:
      "Using OCF rather than FCF means capital expenditure is not charged — a utility and a software firm at the same OCF/EV are not equally cheap. Our EV uses long-term debt and balance-sheet cash only, omitting short-term debt, leases, pensions, and minority interests. Undefined when EV is not positive, which can occur for companies whose cash exceeds market cap plus debt.",
  },
  {
    slug: "mc-vs-10x-ocf",
    name: "Market cap vs 10× OCF",
    category: "Valuation",
    oneLiner:
      "The current market cap as a ratio of ten times operating cash flow — a fixed anchor for spotting inexpensive cash generators.",
    formula:
      "Ratio = market cap ÷ (10 × operating cash flow); 1.0 means the company trades exactly at 10× OCF",
    why:
      "Ten times operating cash flow is a deliberately simple anchor: at that price, the enterprise's pre-capex cash would repay your purchase in a decade, roughly a 10% cash yield. Historically, durable businesses have rarely stayed below that level for long. The ratio turns the anchor into a screen — below 1.0 the market is offering the company at or under the anchor; far above it, you are paying for growth and must judge whether the growth is real.",
    goodBad:
      "At or below 1.0 (market cap ≤ 10× OCF) is the zone worth investigating — either a bargain or a business the market believes is deteriorating, and your job is to determine which. 1.0–2.5 covers most reasonably priced quality companies. Above 3–4, the valuation rests mostly on expectations of substantial future growth.",
    caveats:
      "The anchor ignores capex entirely, so capital-intensive companies look cheaper than they are — a business that must reinvest most of its OCF is not yielding 10% at 10× OCF. It also ignores debt; cross-check with OCF yield on EV, which fixes both blind spots for leverage. A fixed multiple cannot account for interest-rate regimes: when bonds yield 1%, 10× OCF is a stricter test than when they yield 5%.",
  },

  // ── Interpretation ────────────────────────────────────────────────────────
  {
    slug: "implied-fcf-growth",
    name: "Reverse DCF: implied FCF growth",
    category: "Interpretation",
    oneLiner:
      "The annual free-cash-flow growth rate the current market cap silently assumes, solved from a standard discounted-cash-flow model.",
    formula:
      "Solve for g such that: sum of FCF × (1+g)^t ÷ 1.10^t over t = 1…10, plus a terminal value at 2.5% perpetual growth, equals today's market cap",
    why:
      "Instead of forecasting cash flows and arguing about fair value, this runs the DCF backwards: the price is taken as given, and the model extracts the growth expectation embedded in it. That converts an unanswerable question (what is this worth?) into an answerable one: is it plausible that this company grows free cash flow at the implied rate for a decade? You can check plausibility directly against the company's own 5- and 10-year FCF history. The approach follows Rappaport and Mauboussin's Expectations Investing.",
    goodBad:
      "Implied growth well below the company's demonstrated FCF growth suggests low expectations and potential upside if the past merely continues. Implied growth far above history — say 15% implied against 6% achieved — means you are underwriting an acceleration that needs a specific, articulable reason. Implied growth near zero or negative for a stable business is where bargains live. Assumptions: 10% discount rate, 2.5% terminal growth, 10-year horizon.",
    caveats:
      "The output is only as meaningful as the base FCF: a temporarily depressed or inflated latest-year FCF shifts the implied rate substantially. The fixed 10% discount rate is a convention, not a market rate — in low-rate periods it is conservative, in high-rate periods generous. Undefined for companies with negative FCF, and the solver only searches between −50% and +100% growth.",
  },
  {
    slug: "lynch-classification",
    name: "Lynch classification",
    category: "Interpretation",
    oneLiner:
      "A growth-based label — slow grower, stalwart, or fast grower — following Peter Lynch's company categories.",
    formula:
      "Based on 5-year revenue CAGR (3-year as fallback): below 5% = slow grower; 5–12% = stalwart; above 12% = fast grower",
    why:
      "Peter Lynch's insight in One Up on Wall Street is that companies belong to categories, and the category determines which metrics matter and what a reasonable outcome looks like. Judging a slow grower by its growth rate, or a fast grower by its dividend, is a category error. A slow grower is a yield-and-payout story; a stalwart is a buy-at-fair-price, sell-at-euphoria story; a fast grower is a runway-and-valuation story where the growth's durability is everything.",
    goodBad:
      "No label is better than another — each has a matching playbook. For slow growers, weight shareholder yield and payout sustainability. For stalwarts, weight quality score and price against the company's own multiple history. For fast growers, weight the reverse-DCF implied growth against demonstrated growth, and watch dilution. Mismatches are the signal: a fast grower priced like a stalwart, or a slow grower priced like a fast grower.",
    caveats:
      "Lynch defined six categories; our automated label covers the three growth tiers. Cyclicals, turnarounds, and asset plays cannot be detected reliably from a growth rate alone — a cyclical near its peak looks like a fast grower and near its trough like a failing slow grower, and both readings mislead. If the company is in a boom-bust industry, apply the cyclical playbook manually regardless of the label shown.",
  },
  {
    slug: "quality-score",
    name: "Quality score (0–100)",
    category: "Interpretation",
    oneLiner:
      "A composite 0–100 score summarizing profitability, growth, consistency, balance-sheet strength, and capital discipline.",
    formula:
      "Profitability 30 pts (net margin up to 15: >15% = 15, >8% = 10, >2% = 5; ROE up to 15: >20% = 15, >12% = 10, >6% = 5) + Growth 25 pts (revenue CAGR up to 10: >10% = 10, >4% = 7, >0 = 3; FCF CAGR up to 15: >10% = 15, >4% = 10, >0 = 5) + Consistency 20 pts (share of last 10 years profitable × 10 + share FCF-positive × 10) + Balance sheet 15 pts (debt/FCF: none or <2 = 10, <4 = 6, <6 = 3; cash > debt = 5) + Capital discipline 10 pts (shrinking share count = 5; SBC/FCF < 15% = 5)",
    why:
      "No single metric identifies a good business, and any single metric can be gamed. The score forces the evidence to agree: high margins and returns on equity (is the business profitable?), growing revenue and FCF (is it going anywhere?), a decade of consistent profits and cash generation (is it durable?), manageable debt with a cash cushion (can it survive trouble?), and a shrinking share count with modest stock compensation (does management treat owners well?). Businesses that score well on all five at once are structurally rare.",
    goodBad:
      "70 and above is labeled High — strength across most dimensions simultaneously. 45–69 is Medium, typically strong in some areas and weak in others; the breakdown tells you which. Below 45 is Low, meaning multiple pillars are weak at once. The score requires at least 4 years of filing history to compute. Note that valuation is deliberately excluded: a great business at 60 times cash flow keeps its high score — quality and price are separate questions.",
    caveats:
      "Thresholds are calibrated for ordinary operating companies; banks, insurers, REITs, and young loss-making growth companies will score poorly or oddly because the inputs mean different things for them. The score is backward-looking by construction — a moat that just broke still scores on its history. Treat it as a filter and a summary of the record, never as a verdict on the future.",
  },

  // ── Red flags ─────────────────────────────────────────────────────────────
  {
    slug: "flag-revenue-decline",
    name: "Red flag: revenue declining",
    category: "Interpretation",
    oneLiner:
      "Triggered when the latest fiscal year's revenue fell more than 3% below the prior year's.",
    formula: "Trigger: latest revenue < 97% of prior-year revenue",
    why:
      "Shrinking revenue is the most fundamental warning a business can give: fewer customers, lower prices, or lost share. Costs rarely shrink as fast as sales, so revenue declines compress margins with a lag, and every downstream number — earnings, FCF, the quality score's growth points — deteriorates from here first. The 3% threshold filters out rounding-level noise while catching genuine contraction.",
    goodBad:
      "When triggered, establish the cause before anything else: a divested segment or currency swing is mechanical; a cyclical downturn is survivable if the balance sheet is; loss of a major customer or secular decline in the product is the serious case. One down year after a decade of growth is very different from the third consecutive decline.",
    caveats:
      "The check compares only two fiscal years, so it misses slow multi-year erosion under 3% a year and can trigger on a one-off (a 53-week prior year, a large divestiture, currency at a multinational). Companies exiting low-quality revenue on purpose — shrinking to improve margins — trigger the flag while doing the right thing. It is a question, not a verdict.",
  },
  {
    slug: "flag-negative-fcf",
    name: "Red flag: negative free cash flow",
    category: "Interpretation",
    oneLiner:
      "Triggered when operating cash flow did not cover capital expenditures in the latest fiscal year.",
    formula: "Trigger: free cash flow (OCF − capex) < 0",
    why:
      "A business with negative FCF consumed more cash than it produced: the shortfall was funded from cash reserves, new debt, or new shares. That is normal for a young company building capacity, and alarming for a mature one. Persistent negative FCF means shareholders are funding operations rather than being paid by them, and dilution or leverage will compound the problem. Most severe financial distress is preceded by years of negative free cash flow.",
    goodBad:
      "When triggered, decompose it: is operating cash flow itself negative (the business loses cash before any investment — most serious), or is OCF positive but overwhelmed by capex (an investment story to evaluate on its own merits)? Check how many of the last ten years were FCF-negative — the consistency component of the quality score shows this directly — and how long the current cash balance covers the burn.",
    caveats:
      "A single negative year from a large discretionary project can be value-creating, not distressed. Our FCF subtracts all capex, making no distinction between maintenance and expansion. Working-capital timing can briefly push FCF negative at healthy, fast-growing companies. The pattern over years matters far more than any single year.",
  },
  {
    slug: "flag-net-loss",
    name: "Red flag: net loss",
    category: "Interpretation",
    oneLiner: "Triggered when the company reported negative net income in the latest fiscal year.",
    formula: "Trigger: net income < 0",
    why:
      "A net loss means that after every cost, the year destroyed rather than created accounting value. Beyond the direct signal, losses disable much of the valuation toolkit — P/E and earnings yield become undefined — and loss-making companies depend on capital markets staying open to them, a dependency that is most dangerous exactly when markets tighten. Repeated losses also erode book equity, weakening the balance sheet from within.",
    goodBad:
      "When triggered, check the cash flow statement first: a company with a net loss but solid positive FCF is often just carrying heavy non-cash charges (amortization from acquisitions is the classic case), which is a far milder situation than losing actual cash. Then check the ten-year consistency record — one loss in a decade of profits is an event to explain; five losses in a decade is a business model question.",
    caveats:
      "One-time items — impairments, legal settlements, tax charges — can produce a loss year at a fundamentally healthy company. Conversely, positive net income with negative FCF is often the worse combination. Early-stage growth companies price in losses by design; for them the flag is a reminder of the burn-rate question, not new information.",
  },
  {
    slug: "flag-heavy-debt",
    name: "Red flag: heavy debt load",
    category: "Interpretation",
    oneLiner:
      "Triggered when long-term debt exceeds five years of free cash flow.",
    formula: "Trigger: long-term debt ÷ free cash flow > 5",
    why:
      "At more than five years of FCF, debt stops being background and starts driving outcomes. Interest consumes cash flow, refinancing becomes a recurring bet on market conditions, and a downturn that halves FCF turns a 5x ratio into 10x overnight. Leveraged companies lose optionality precisely when it is most valuable — forced to cut investment, sell assets, or issue shares at depressed prices while stronger competitors advance.",
    goodBad:
      "When triggered, look at three things: the maturity schedule (debt due within two to three years is the acute risk; long-dated fixed-rate debt is much softer), the stability of the cash flow (5x on a utility is routine; 5x on a cyclical is dangerous), and the trend (rising leverage to fund buybacks at high prices is the worst pattern; falling leverage after an acquisition is often fine). Cash on hand matters too — check cash/debt for the net position.",
    caveats:
      "The denominator is one year of FCF, so a temporarily weak year can trigger the flag at a company whose normal cash flow covers debt comfortably. Only long-term debt is counted — short-term borrowings and lease obligations are excluded, so true leverage can be higher than shown. Some businesses with contractual, utility-like revenue sustain high leverage safely for decades.",
  },
  {
    slug: "flag-heavy-sbc",
    name: "Red flag: heavy stock compensation",
    category: "Interpretation",
    oneLiner:
      "Triggered when stock-based compensation exceeds 30% of free cash flow.",
    formula: "Trigger: stock-based compensation ÷ free cash flow > 0.30",
    why:
      "At this level, nearly a third of the headline free cash flow is being financed by issuing new shares to employees — the cash looks free only because shareholders are paying for it with dilution. Reported FCF, FCF yield, and P/FCF all flatter the company. Buybacks at such companies often merely absorb compensation issuance, spending owners' cash to stand still. The 30% line marks where this stops being a rounding adjustment and starts changing the investment math.",
    goodBad:
      "When triggered, restate the numbers yourself: subtract SBC from FCF and recompute the yield — that approximates the cash generation accruing to existing holders. Then check the share-count change: if the diluted count is flat or falling despite heavy SBC, buybacks are covering the issuance (at a real cash cost); if the count is rising too, dilution is compounding the problem. Also check the trend — SBC ratios that fall as a company matures are the healthy pattern.",
    caveats:
      "SBC expense is a grant-date estimate, not the market value of shares eventually issued, so the ratio is approximate in both directions. The alternative to SBC is cash pay, which would reduce OCF directly — the issue is measurement distortion, not that equity pay is inherently bad. A depressed-FCF year can trigger the flag without any change in compensation practice.",
  },
  {
    slug: "flag-dilution",
    name: "Red flag: shareholder dilution",
    category: "Interpretation",
    oneLiner:
      "Triggered when the diluted share count has grown by more than 2% per year over roughly five years.",
    formula: "Trigger: 5-year share count CAGR > +2% per year",
    why:
      "Dilution is a silent, compounding tax on ownership. At 2% annual issuance, an investor's proportional claim shrinks by about 10% over five years — the business must grow that much before the shareholder gains anything per share. Unlike most costs, dilution never appears on the income statement as such; the only place to see it is the share count itself, which is why we flag its trajectory directly.",
    goodBad:
      "When triggered, identify the source: routine stock compensation issuance (a recurring cost — read with SBC/FCF), acquisition currency (judge the deals — issuing cheap stock for expensive targets destroys value, the reverse can create it), or capital raises (for a cash-burning company, expect the dilution to continue). The best pattern after a triggered flag is a management that acknowledges it and commits to net share reduction.",
    caveats:
      "Historical counts are split-adjusted, so the figure reflects genuine issuance. A single large equity raise or stock-funded acquisition can push the 5-year rate over 2% without an ongoing practice — check whether the count is still rising year by year. Young companies dilute more as a matter of course; the question is whether the rate is declining as they scale.",
  },
  {
    slug: "flag-overdistribution",
    name: "Red flag: distributions exceed FCF",
    category: "Interpretation",
    oneLiner:
      "Triggered when dividends plus buybacks exceeded free cash flow in the latest fiscal year.",
    formula: "Trigger: (dividends paid + buybacks) ÷ free cash flow > 1",
    why:
      "A company can only sustainably return what it generates. When distributions exceed FCF, the difference came from the balance sheet — drawing down cash or adding debt — which converts a shareholder return into a slow-motion leveraging of the company. The pattern is most dangerous when it is chronic: each year of over-distribution reduces the cushion available for the downturn that eventually tests it, and dividend cuts forced by arithmetic are punished severely by markets.",
    goodBad:
      "When triggered, separate the two components: dividends are sticky commitments (an uncovered dividend is a structural problem), while buybacks are discretionary and can be stopped without ceremony (a one-year buyback surge past FCF may be deliberate opportunism). Check whether FCF was temporarily depressed or the payout permanently outgrew cash generation, and watch the debt trend — over-distribution funded by borrowing shows up in a rising debt/FCF ratio.",
    caveats:
      "A cash-rich company deliberately returning accumulated reserves triggers the flag while doing something entirely rational — the balance sheet context matters. One capex-heavy year can depress FCF below an otherwise well-covered payout. The flag evaluates a single fiscal year; the multi-year payout ratio trend is the more reliable signal.",
  },
  {
    slug: "flag-margin-compression",
    name: "Red flag: margin compression",
    category: "Interpretation",
    oneLiner:
      "Triggered when gross margin has fallen more than 5 percentage points versus three fiscal years ago.",
    formula: "Trigger: current gross margin < gross margin three years prior − 5 points",
    why:
      "Gross margin is where competitive position shows up first. Erosion of this size rarely comes from cost inflation alone — it usually means the company is cutting prices to hold volume, its product mix is shifting toward lower-value offerings, or competitors have broken its pricing power. Because gross margin sits above every operating expense, a 5-point loss flows straight through to operating and net margins unless overhead is cut to match, which has its own costs.",
    goodBad:
      "When triggered, find the driver: input-cost spikes (may reverse and can sometimes be repriced later), mix shift (may be a deliberate strategy — hardware companies growing lower-margin services, for example), or price competition (the structural case that most often precedes long-term decline). Management's explanation in the 10-K's MD&A section, and whether the erosion is decelerating, are the key evidence.",
    caveats:
      "The check compares two points three years apart, so a temporarily depressed latest year (commodity input spike, inventory write-down) can trigger it without structural change. Some strategic transitions legitimately trade gross margin for a larger or stickier revenue base. Cost-classification changes between cost of revenue and operating expense can also move the ratio without any economic shift.",
  },
];

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "reading-a-10k",
    title: "Reading a 10-K",
    summary:
      "The three financial statements, which of our metrics comes from each, and why we build everything from SEC filings.",
    body: [
      "Every US public company files an annual report with the Securities and Exchange Commission called a 10-K. It is the most complete, most reliable document a company produces about itself: audited financial statements, a description of the business, its risks, and management's own discussion of the results. Quarterly updates arrive in a shorter filing called a 10-Q. Everything on this site is derived from the numbers in these filings, retrieved directly from SEC data, because the filing is the primary source — every data vendor, news article, and screener is downstream of it, and each step downstream is a chance for numbers to be adjusted, relabeled, or simply wrong.",
      "The heart of a 10-K is three financial statements, and each answers a different question. The income statement asks: what did the company earn this period? The balance sheet asks: what does it own and owe at this moment? The cash flow statement asks: where did cash actually come from and where did it go? The three are linked — profit from the income statement flows into equity on the balance sheet, and the cash flow statement reconciles reported profit to the change in actual cash — but each can look healthy while another deteriorates, which is exactly why you need all three.",
      "The income statement runs from revenue at the top to net income at the bottom. Revenue is what customers paid; subtracting the direct cost of goods sold gives gross profit; subtracting operating expenses (R&D, sales, administration) gives operating income; and after interest and taxes, net income remains. From this statement we compute revenue growth (the 3-, 5-, and 10-year CAGRs), the margin ladder — gross margin, operating margin, net margin — and diluted earnings per share, whose growth we track over 5 and 10 years. The margins tell you how much of each revenue dollar survives each layer of cost; the growth rates tell you whether the whole engine is expanding.",
      "The balance sheet is a snapshot: assets on one side, liabilities and shareholders' equity on the other, always in balance because equity is defined as whatever remains after liabilities are subtracted from assets. From it we take cash and equivalents, long-term debt, total assets, net property plant and equipment, and equity. These feed our leverage metrics (debt to equity, debt to FCF, cash to debt), our return measures (ROE, ROA, and cash ROIC, which uses equity plus long-term debt as invested capital), and our capital-intensity measures (PP&E to revenue, and the sales-efficiency ratio that tracks how much new PP&E each dollar of new revenue required).",
      "The cash flow statement is the one professionals trust most, because it is the hardest to shape with accounting judgment. It has three sections. Operating cash flow starts from net income and adds back non-cash items (depreciation, stock-based compensation) and working-capital changes, arriving at the cash the business actually collected. Investing cash flow contains capital expenditures — the money spent on equipment and facilities. Financing cash flow shows dividends paid, share repurchases, and debt raised or repaid. From this statement we compute free cash flow (operating cash flow minus capex) and everything built on it: FCF margin, FCF yield, FCF growth, debt to FCF, SBC to FCF, the payout ratio, dividend and buyback yields, and the reverse-DCF implied growth.",
      "A note on fiscal years: companies choose their own year-end, so Apple's fiscal 2025 ends in September while Walmart's fiscal 2025 ends in January. Our data is organized by fiscal year as reported, and metrics labeled 'latest' refer to the most recent completed fiscal year, not the most recent quarter. This means our figures can lag current conditions by up to a year — a deliberate trade: annual figures are audited, complete, and free of seasonal noise, at the cost of freshness. One further adjustment we make: old filings report share counts and EPS as they stood at the time, without restating for later stock splits, so we detect split boundaries and adjust historical shares and EPS to make per-share series comparable across time.",
      "When you open an actual 10-K, the financial statements sit in Item 8, but two other sections repay reading. Item 1A, Risk Factors, lists what management is legally obliged to warn you about — most of it boilerplate, but the specific, unusual entries are informative. Item 7, Management's Discussion and Analysis, is where management explains in prose why revenue and margins moved, and it is the first place to look when one of our red flags triggers: if gross margin compressed or revenue declined, the company's own explanation is here.",
      "The practical workflow this site is built around: use the computed metrics to find companies worth attention and to spot the questions — a declining margin, a rising share count, a debt load that grew. Then go to the filing itself for answers. The metrics compress fifteen years of statements into a screenable summary; the 10-K holds the context no summary can carry. Neither substitutes for the other.",
    ],
  },
  {
    slug: "quality-investing",
    title: "What makes a business high quality",
    summary:
      "The traits of durable businesses, how our 0–100 quality score encodes them, and Peter Lynch's six company categories.",
    body: [
      "Quality, in investing, has a reasonably precise meaning: a high-quality business earns high returns on the capital invested in it, can reinvest at those returns or return the surplus to owners, and can sustain this for a long time against competition. Price tells you what you pay; quality tells you what you get. The two questions are independent — a wonderful business can be a poor investment at the wrong price, and a mediocre business a good one at a deep enough discount — but over long holding periods, the quality of the business tends to dominate the outcome, because your return converges toward what the business itself earns on its capital.",
      "The first pillar is profitability with pricing power. High gross margins mean customers pay well above the cost of producing the product — evidence they value something competitors cannot easily replicate: a brand, a switching cost, a network, a patent. High and stable net margins mean that advantage survives all the way through the cost structure. The revealing pattern is margin behavior under stress: a business that holds or raises prices through inflation and recession has pricing power; one whose margins swing with the cycle is a price-taker, however large it may be.",
      "The second pillar is growth with consistency. A business that grows revenue and free cash flow together, year after year, is compounding; one that grows revenue while cash flow stagnates is buying growth. Consistency is underrated because it is unglamorous: a company profitable in ten years out of ten, FCF-positive in ten out of ten, has demonstrated something statistical about its resilience that no single spectacular year can. Streaks like that are rare, and they are exactly what our consistency component counts.",
      "The third pillar is high returns on capital with low capital intensity. Return on equity and cash ROIC measure how much profit or cash each dollar of invested capital produces — the engine speed of compounding. Capital intensity measures how much fuel the engine needs: a business that adds revenue with almost no new plant and equipment (low PP&E to revenue, low sales-efficiency ratio) converts growth into distributable cash immediately, while an asset-heavy business must reinvest most of its cash flow just to stay in place. The best businesses combine both: high returns on little capital, which means growth is nearly free.",
      "The fourth pillar is a clean balance sheet and disciplined ownership. Low debt relative to free cash flow means the company controls its own destiny in a downturn; cash exceeding debt means it can play offense when others must retrench. A shrinking share count means management returns capital and each remaining share owns more of the business; modest stock-based compensation means reported cash flow actually belongs to shareholders. These traits share a common root — a management that treats shareholders' capital as scarce.",
      "Our quality score compresses these pillars into a 0–100 number with explicit weights. Profitability carries 30 points: up to 15 for net margin (full credit above 15%) and up to 15 for ROE (full credit above 20%). Growth carries 25: up to 10 for revenue CAGR (full credit above 10% a year) and up to 15 for FCF CAGR (full credit above 10%) — cash-flow growth deliberately outweighs revenue growth. Consistency carries 20: the fraction of the last ten years with positive net income, and the fraction with positive FCF, each worth up to 10. Balance sheet carries 15: up to 10 for low debt to FCF (full credit below 2 years or no debt) and 5 for holding more cash than debt. Capital discipline carries the final 10: 5 for a shrinking share count and 5 for SBC below 15% of FCF. Scores of 70 or above are labeled High, 45–69 Medium, below 45 Low, and at least four years of filings are required before we compute it at all.",
      "The score's limits are worth internalizing. It is entirely backward-looking: a moat that broke last quarter still scores on its ten-year record. Its thresholds suit ordinary operating companies — banks, insurers, REITs, and young loss-making growth companies will score low or strangely because the inputs mean different things for them. And it deliberately excludes valuation: a superb business at an absurd price keeps its high score. Use it to filter and to see the shape of a company's record at a glance, then investigate the components — the same score can be earned in different ways, and the composition matters.",
      "Peter Lynch's framework from One Up on Wall Street adds the categorical lens: companies come in kinds, and the kind determines what to measure. Slow growers are large, mature companies expanding little faster than the economy — you own them for dividends, so payout sustainability and shareholder yield are the metrics that matter. Stalwarts are big, reliable compounders growing in the mid-single to low-double digits — the game is buying them at reasonable prices and not overpaying for their safety. Fast growers are small or mid-sized companies expanding above 12% or so a year — the largest fortunes and the largest losses live here, and the metrics that matter are the durability of growth, dilution, and what the price already assumes. Cyclicals rise and fall with their industries — for them, low trailing multiples at peak earnings are a trap, and the cycle position matters more than any ratio. Turnarounds are damaged companies that may recover — the balance sheet decides whether they live long enough to try. Asset plays own something the market has overlooked — land, holdings, spectrum — where price to book and the asset value matter more than earnings.",
      "Our automated Lynch label sorts companies into the three growth tiers — slow grower below 5% five-year revenue CAGR, stalwart to 12%, fast grower above — because growth is what filings measure cleanly. The other three categories require judgment the data cannot supply: recognizing that an energy company's beautiful five-year record is a cycle, not a trend, or that a retailer's real value is its real estate. The label is a starting shelf, not a verdict; the important habit is asking, for every company, which game is being played here, and which of our metrics is the scoreboard for that game.",
    ],
  },
  {
    slug: "valuation-basics",
    title: "Valuation basics",
    summary:
      "Multiples and their inverse yields, comparing against bonds, why cash flow beats earnings, and the 10x operating cash flow anchor.",
    body: [
      "Valuation starts from an uncomfortable truth: a share of stock is worth the cash it will deliver to its owner over its lifetime, discounted for time and risk — and nobody knows what that is. Every valuation tool is a way of approximating that unknowable number or of sidestepping the need to know it. Multiples, yields, anchors, and reverse-engineering are the four approaches this site uses, and each is best understood as a different compression of the same underlying question: what are you paying, and what are you getting?",
      "A multiple divides price by a measure of what the business produces. P/E is market cap over net income: pay 20 times earnings and, if earnings never changed and were fully paid out, you would recoup the price in 20 years. P/FCF replaces earnings with free cash flow. P/S uses revenue — meaningful only in light of what margins that revenue can eventually carry. P/B compares price to accounting net worth, mostly useful for banks and asset-heavy companies whose book values approximate reality. Enterprise-value multiples like OCF yield on EV go one step further and price the whole firm, debt included: EV is market cap plus debt minus cash — what it would truly cost to own the business outright — and it makes companies with different balance sheets comparable, which market-cap multiples quietly fail to do.",
      "Every multiple has an inverse, and the inverse is often more intuitive: a P/E of 20 is an earnings yield of 5%; a P/FCF of 25 is an FCF yield of 4%. Yields put stocks in the same units as every other asset. A 10-year Treasury paying 4% is the risk-free alternative; a stock offering a 5% FCF yield pays you one point more, plus whatever growth materializes, minus whatever goes wrong. That spread is the whole equity bargain in one line. When earnings yields on stocks fall below bond yields, you are betting entirely on growth; when they sit well above, you are being paid to wait. This comparison — equity yield versus bond yield — is the oldest sanity check in investing and still among the best.",
      "Why do we lean on cash flow rather than earnings? Net income is an opinion — a careful, audited opinion, but an opinion: it depends on depreciation schedules, revenue-recognition timing, reserve estimates, and one-time items. Cash is a fact. Free cash flow — operating cash flow minus capital expenditure — is the money genuinely available to owners after the business has paid its bills and maintained itself. Companies can report growing profits for years while cash stagnates (the gap usually hiding in receivables, inventory, or aggressive accruals), and that divergence is one of the most reliable early warnings in accounting. When earnings-based and cash-based multiples disagree, believe the cash. One honest caveat: because stock-based compensation is added back in operating cash flow, FCF flatters heavy issuers of stock — which is why we track SBC as a share of FCF alongside it.",
      "Anchors are deliberately crude rules that resist the sophistication trap. Ours is 10 times operating cash flow: a company priced at or below 10x OCF is generating cash at roughly a 10% rate against the whole purchase price — pre-capex — a level at which durable businesses have historically been scarce and worth examining one by one. We display this as a ratio: market cap divided by 10x OCF, where 1.0 or below means the anchor is met. The anchor's blind spots are the price of its simplicity — it ignores capex, so capital-hungry businesses look cheaper than they are, and it ignores debt, which the EV-based OCF yield corrects. Its value is that it cannot be argued into saying whatever you want, which is more than can be said for a spreadsheet of forecasts.",
      "Multiples also mean nothing without a reference point, and there are two honest ones. The first is the company's own history: a business that traded between 15 and 25 times FCF for a decade and now sits at 12 is being repriced — the market believes something changed, and your job is to decide whether it is right. This is reversion logic, and it works exactly when the business itself has not deteriorated, which is the judgment the multiple cannot make for you. The second is peers: comparing a railroad's multiple to a software company's is meaningless, but comparing it to other railroads isolates what you are actually paying for. Cross-sector multiple comparisons are the most common valuation error beginners make.",
      "High multiples are not automatically wrong — they are claims about the future. A stock at 35 times FCF growing that FCF at 20% a year is cheaper, correctly measured, than a stock at 12 times with shrinking cash flow: within a few years the fast grower's cash flow overtakes the price difference. The discipline is to make the claim explicit rather than vibes-based — which growth rate, for how long, justifies this price? That is precisely the question the reverse DCF answers, and it is covered in the expectations-investing guide.",
      "A workable routine, using this site's numbers: start with FCF yield and the 10x-OCF ratio to place the company on the cheap-to-expensive spectrum. Check OCF yield on EV so leverage cannot hide. Compare the current multiples to the company's own range and its sector's medians on the screener. Then ask what the price assumes — the implied-growth figure — and whether the company's record makes that assumption modest or heroic. No single number decides anything; the pattern across all of them usually speaks clearly.",
    ],
  },
  {
    slug: "expectations-investing",
    title: "Expectations investing: the reverse DCF",
    summary:
      "Price equals embedded expectations. Read the growth assumption out of the market cap and judge its plausibility against history.",
    body: [
      "A traditional discounted-cash-flow valuation asks you to forecast a company's cash flows for a decade, pick a discount rate, and pronounce a fair value. The honest problem is that the forecast is the answer in disguise: small changes in assumed growth swing the result enormously, and nobody's ten-year forecasts are reliable. Expectations investing — the approach developed by Alfred Rappaport and Michael Mauboussin in their book Expectations Investing — inverts the exercise. The market price is not an opinion to argue with but a datum to decode: it tells you exactly what the market expects. Your job shifts from forecasting the future to auditing an expectation.",
      "The mechanics are straightforward. A DCF machine takes a growth rate and produces a value; run backwards, it takes today's market cap and solves for the growth rate that would justify it. Our implementation holds everything else fixed — a 10% discount rate, a 10-year explicit horizon, 2.5% growth in perpetuity afterward — and searches for the free-cash-flow growth rate at which the discounted stream equals the current market cap. That rate is the implied FCF growth shown on each company page: the growth assumption you are silently endorsing at today's price.",
      "The number's power is that it converts an impossible question into a tractable one. 'What is this company worth?' has no checkable answer. 'Can this company plausibly grow free cash flow 14% a year for a decade?' can be tested against evidence: the company's own 5- and 10-year FCF growth record sits directly alongside it on the page. History is not destiny, but it is the base rate — and decades of corporate data show that sustained high growth is rarer than markets routinely price. Very few large companies compound FCF above 15% for ten years; a price that requires it is, statistically, a bet against the base rate.",
      "Reading the comparison is the core skill. When implied growth sits well below demonstrated growth — the market pricing 4% from a business that has compounded cash flow at 10% — expectations are low, and merely ordinary performance produces a good outcome; that asymmetry is what a margin of safety looks like in expectations terms. When implied growth far exceeds anything the company has achieved, you need a specific, articulable reason the future will break from the past — a new product cycle, an inflection in margins — and you should notice that you are the one carrying the burden of proof. When implied growth is near zero or negative for a stable, profitable business, the market is pricing decline; if the business is not declining, that is the classic setup.",
      "Stock returns are driven by expectation revisions, not by results in isolation. A company can grow 20% a year and its stock can still fall, if the price had assumed 30%; a shrinking company can be a fine investment if it shrinks slower than the price assumed. This explains the otherwise puzzling pattern of great companies making poor stocks and mediocre companies making good ones — the outcome depends on results relative to embedded expectations. The reverse DCF makes the embedded expectation visible, which is the entire point: you cannot judge whether expectations are beatable until you know what they are.",
      "The tool's assumptions deserve scrutiny, because they shape the output. The 10% discount rate is a convention — roughly the long-run return of US equities — not a market-derived rate; when interest rates are low it is demanding, when high it is lenient, and it embeds no company-specific risk adjustment. The base year matters even more: the model grows the latest fiscal year's FCF, so if that year was unusually fat or lean, the implied rate inherits the distortion. A company whose FCF just doubled on a working-capital swing will show deceptively low implied growth. Glance at the multi-year FCF series before trusting the number, and mentally normalize where needed.",
      "Structural limits: the model cannot run on negative free cash flow, so pre-profitability companies get no reading — for them, expectations live in assumptions about eventual margins and market size that a single-rate model cannot capture. The solver bounds its search between −50% and +100% annual growth, and prices outside that range return nothing. And a single growth rate compresses everything the market may actually be pricing — margin expansion, buybacks, multiple changes — into one dial. The compression is a feature for screening and a limitation for precision.",
      "Used well, the reverse DCF is less a valuation than a discipline. It replaces 'this seems expensive' with 'this price requires 16% compound FCF growth for ten years, and the company has done 7%' — a statement that can be examined, debated, and falsified. For every company you consider, know the number: what does the price assume, and what is the evidence the assumption is beatable? Rappaport and Mauboussin's book develops the full framework — including how to trace expectations to their operational drivers — and is the natural next read if this way of thinking suits you.",
    ],
  },
  {
    slug: "red-flags",
    title: "Reading the red flags",
    summary:
      "What each automated warning checks, why the threshold sits where it does, and how to investigate a triggered flag.",
    body: [
      "The red flags on each company page are automated checks against specific thresholds in the latest filings. They are questions, not verdicts: a triggered flag means 'look here', never 'avoid this company'. Excellent businesses trigger flags during transitions and bad years; fragile businesses can pass every check right up until they fail. The flags' value is direction — they tell you where to spend your investigation time — and their limits come from their construction: most compare only a year or two of data, and none knows why a number moved. The why is your job. What follows is each check, its threshold, and how to pursue it.",
      "Revenue declining — latest fiscal-year revenue more than 3% below the prior year. The threshold exists to skip rounding noise and catch real contraction. Costs never shrink as fast as sales, so revenue declines compress everything downstream with a lag. Investigate the cause in the 10-K's management discussion: divestitures and currency are mechanical and mild; cyclical downturns are survivable if the balance sheet is strong; lost customers or a product in secular decline is the serious case. A first down year after a long climb is an event to explain — a third consecutive decline is a trend to respect.",
      "Negative free cash flow — operating cash flow failed to cover capital expenditure. The company consumed cash, and the shortfall came from reserves, debt, or new shares. The critical decomposition: if operating cash flow itself is negative, the core business loses money before any investment, the most serious reading. If OCF is positive but capex overwhelms it, you are looking at an investment program — judge it on the returns the spending is likely to earn. Check how many of the last ten years were FCF-negative (the quality score's consistency component shows this) and how long current cash covers the burn rate.",
      "Net loss — negative net income in the latest fiscal year. Beyond the direct signal, a loss disables the P/E and earnings yield and makes the company dependent on external capital, a dependency most dangerous when markets tighten. First check the cash flow statement: a net loss alongside solidly positive free cash flow usually indicates heavy non-cash charges — acquisition amortization is the classic case — and is far milder than a loss with negative cash flow. Then check frequency: one loss in a profitable decade is an incident; repeated losses are the business model.",
      "Heavy debt load — long-term debt above five times free cash flow. At five-plus years of cash flow, debt drives outcomes: refinancing becomes a recurring bet, and a downturn that halves FCF doubles the ratio overnight. Three things determine severity: the maturity wall (debt due soon is acute risk; long-dated fixed-rate debt is soft), cash-flow stability (5x on a regulated utility is routine, on a cyclical it is dangerous), and the trend (leverage rising to fund buybacks at high prices is the worst pattern). Check cash-to-debt for the net position — a company with debt fully offset by cash is differently placed than one without reserves.",
      "Heavy stock compensation — SBC above 30% of free cash flow. Because SBC is added back in the cash-flow statement, reported FCF at that level materially overstates what accrues to existing shareholders: roughly a third of the 'free' cash is financed by issuing shares. Restate the numbers yourself — subtract SBC from FCF and recompute the yield — and check the share-count trajectory: a flat count despite heavy SBC means buybacks are absorbing the issuance at real cash cost; a rising count means dilution compounds the problem. Falling SBC ratios as a company matures is the healthy pattern.",
      "Shareholder dilution — diluted shares growing more than 2% a year over five years. At that pace your proportional ownership shrinks about 10% in five years, a compounding tax the income statement never shows. Identify the source: compensation issuance (recurring; read with the SBC flag), acquisition currency (judge the deals bought with it), or financing raises (at a cash-burner, expect more). Because we split-adjust historical counts, the figure reflects genuine issuance. The constructive resolution is a management that names the problem and commits to net reduction.",
      "Distributions exceeding FCF — dividends plus buybacks above 100% of free cash flow. The excess came from the balance sheet: falling cash or rising debt. Separate the components, because they differ in stickiness: dividends are near-commitments, and an uncovered dividend is a structural problem that often ends in a punished cut; buybacks are discretionary, and a one-year surge past FCF can be deliberate opportunism. Determine whether FCF was temporarily depressed or the payout has permanently outgrown generation, and watch debt-to-FCF for confirmation that over-distribution is being borrowed.",
      "Margin compression — gross margin down more than 5 points versus three years ago. Gross margin is where competitive position surfaces first, and erosion this size usually means price cuts to defend volume, a mix shift toward lower-value revenue, or broken pricing power. The three drivers differ in prognosis: input-cost spikes can reverse; deliberate mix shifts can be strategy; price competition is the structural case that precedes decline. Management's explanation in the MD&A, and whether erosion is decelerating, are the evidence to weigh.",
      "Two closing disciplines. First, flags compound: any single flag has an innocent explanation, but three or four triggering together — say declining revenue, compressed margins, and distributions above FCF — describe a company under real strain, and the innocent explanations must all be true simultaneously. Second, absence of flags is not endorsement: these checks read history, and a richly priced company with a pristine record can still disappoint purely through valuation. The flags police the business; the valuation metrics police the price; an investment case needs to survive both.",
    ],
  },
  {
    slug: "capital-allocation",
    title: "Capital allocation",
    summary:
      "Dividends, buybacks, dilution, stock compensation, reinvestment efficiency, and debt — and how to read the discipline metrics together.",
    body: [
      "Once a business generates cash, management faces the decision that quietly determines long-term shareholder outcomes: what to do with it. The options are few — reinvest in operations, acquire, pay down debt, pay dividends, repurchase shares, or let cash accumulate — and over a decade, the compounded consequences of these choices frequently outweigh the operations themselves. Two identical businesses run by allocators of different skill produce very different outcomes for owners. This guide walks through each tool and the metrics we compute to judge how a management uses them.",
      "The first claim on cash is reinvestment, and its merit depends entirely on the return earned. A company reinvesting at a 25% cash return on capital should retain every dollar it can deploy — internal compounding at that rate beats anything shareholders could do with a distribution. A company reinvesting at 5% destroys value with every retained dollar, however impressive the resulting growth looks. This is why cash ROIC is the first metric to consult: it is the rate at which retained money compounds. Our sales-efficiency ratio adds the incremental view — how much new plant and equipment each dollar of new revenue actually required over the past five years — and PP&E-to-revenue shows the standing capital intensity of the model. Low intensity plus high returns is the combination that makes growth nearly free; high intensity plus mediocre returns means growth is a treadmill.",
      "Dividends are the simplest tool: cash leaves the company and arrives with shareholders, no judgment required about reinvestment and no debate about value. Their strength is the discipline they impose — a dividend is a standing claim that management must earn before funding pet projects — and the information they carry, since managements cut them only in genuine distress. Their weaknesses are tax inefficiency in taxable accounts and inflexibility: once established, a dividend is close to a commitment. We show the dividend yield (cash actually paid last fiscal year against today's market cap) and, more importantly, its coverage through the FCF payout ratio.",
      "Buybacks are the subtler tool, and the crucial fact about them is price sensitivity. When a company repurchases shares below intrinsic value, the remaining shareholders' stake in every future dollar grows at a discount — value transfers to those who stay. When it repurchases above intrinsic value, the transfer runs the other way: continuing holders subsidize the sellers. The identical mechanical act creates or destroys value depending only on the price paid, which is why 'the company buys back stock' is by itself neither good nor bad news. The empirical pattern to watch for is procyclicality — many companies buy heavily when cash is abundant and prices high, then halt repurchases in downturns when shares are cheap, precisely backwards. A management that repurchases more as the price falls is demonstrating the discipline that makes buybacks valuable.",
      "The buyback number that cannot lie is the share count itself. Gross repurchase spending — our buyback yield — measures effort; the five-year share-count change measures result. The gap between them is stock-based compensation: a company can spend billions on repurchases while the count stays flat, because buybacks are merely mopping up shares issued to employees. In that case shareholders received nothing — the repurchase budget was compensation expense in disguise. This is why SBC-to-FCF sits among our capital-discipline metrics: SBC is a real cost paid in ownership, added back in the cash-flow statement, and at high levels (our red flag triggers above 30% of FCF) it makes reported free cash flow substantially overstate what owners actually keep. The clean readings: count falling with modest SBC is genuine capital return; count flat with heavy SBC is treading water; count rising above 2% a year triggers our dilution flag and means owners are being taxed.",
      "Debt paydown is the least glamorous allocation and sometimes the best. Retiring debt earns a certain, immediate return — the interest rate avoided — plus something harder to see: optionality. Every downturn, credit crunch, and industry crisis transfers assets from leveraged players to unleveraged ones; the company with debt under two years of FCF and cash exceeding borrowings gets to be the buyer. Watch the trajectory of debt-to-FCF over time: paying down debt when it is expensive and borrowing modestly when it is cheap is allocation skill, while leverage that rises to fund buybacks at peak prices is the signature of its absence.",
      "Reading the metrics together is where the picture forms, because each corrects another's blind spot. Start with shareholder yield — dividends plus buybacks against market cap — for the headline rate of cash return. Verify it with the FCF payout ratio: a yield the company generates is durable, one it borrows (payout above 100% triggers our over-distribution flag) is a drawdown in disguise. Verify the buyback half with the share-count change and SBC ratio: is spending becoming ownership, or offsetting compensation? Then place it against reinvestment: a modest shareholder yield from a business compounding retained cash at 25% is better allocation than a large yield from one with nowhere to invest. The quality score's ten capital-discipline points condense the ownership half of this — five for a shrinking count, five for SBC under 15% of FCF.",
      "The synthesis question, for any company, is whether cash consistently flows toward its highest-returning use. High-return reinvestment funded first; debt kept low enough to preserve options; the surplus returned through price-sensitive buybacks or well-covered dividends rather than hoarded or spent on empire-building acquisitions; dilution controlled. A management that behaves this way for a decade compounds owner value well beyond what the income statement alone suggests, and the record of it is visible in exactly the metrics above. When the record and the rhetoric diverge — a shareholder-friendly letter over a rising share count and borrowed distributions — believe the record.",
    ],
  },
];

export function getMetric(slug: string): MetricDoc | undefined {
  return METRICS.find((m) => m.slug === slug);
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
