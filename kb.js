/* Approved knowledge base for the 92 Logics demo "digital ambassador".
 * Each block is a short, neutral summary written by 92 Logics from the public
 * source cited in `source`. Nothing here is official Suffolk County Council or
 * Suffolk Economy content. Facts checked 29 Oct 2026; re-check before any use.
 */
(function (root) {
  var KB_BASELINE = [
    {
      id: "overview", topic: "About Suffolk", priority: 2,
      title: "Suffolk at a glance",
      keywords: "suffolk county overview population size where located towns districts ipswich lowestoft bury haverhill east anglia",
      text: "Suffolk is a county in the East of England, bordered by Norfolk, Essex, Cambridgeshire and the North Sea. The Office for National Statistics estimated its population at about 786,000 in mid-2024. Ipswich is the county town and largest settlement; other principal towns include Lowestoft, Bury St Edmunds and Haverhill. Local government is split between the county council and five districts: Babergh, East Suffolk, Ipswich, Mid Suffolk and West Suffolk.",
      more: "The county covers roughly 3,800 square kilometres, with a long North Sea coastline, deep estuaries such as the Orwell, Deben and Stour, and a largely arable inland landscape.",
      source: { name: "Wikipedia: Suffolk (citing ONS population estimates)", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "ONS population estimates", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates" }
    },
    {
      id: "why-invest", topic: "Investment overview", priority: 3,
      title: "Why invest in Suffolk: key facts",
      keywords: "why invest investment good place makes reasons opportunities strengths advantages sectors key overview economy economic business location relocate expand",
      text: "Key facts often cited for investing in Suffolk: it hosts the UK's largest container port at Felixstowe; Freeport East offers tax-site incentives at Felixstowe, Harwich and Gateway 14; the coast is a base for major offshore wind and the Sizewell C nuclear project; and Adastral Park near Ipswich is home to BT's main research centre and other tech firms. The A14 and A12 link the county to the Midlands, Cambridge and London.",
      more: "Ask me about any of these in more detail: the port, Freeport East, offshore wind, Sizewell C, the tech cluster, skills or free business support.",
      source: { name: "Freeport East (official website)", url: "https://www.freeporteast.com/" },
      source2: { name: "Wikipedia: Suffolk (Economy section)", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "Freeport East investor enquiries", url: "https://www.freeporteast.com/" }
    },
    {
      id: "felixstowe", topic: "Ports & logistics", priority: 3,
      title: "Port of Felixstowe",
      keywords: "port felixstowe container shipping logistics trade freight docks import export harbour ships teu",
      text: "The Port of Felixstowe is the UK's largest container port and, by the port's own account, handles close to half of Britain's containerised trade. It has two main container terminals, Trinity and Landguard, a continuous quay of more than 2.3 km, and rail terminals linked to the Felixstowe branch line. Road access is via the A14 towards the Midlands and the A12 towards London.",
      more: "Felixstowe opened Britain's first container terminal in 1967 and has been the UK's largest container port since about 1980. Rail upgrades between Felixstowe and Nuneaton allow high-cube containers to travel by train to the West Coast Main Line.",
      source: { name: "Wikipedia: Port of Felixstowe", url: "https://en.wikipedia.org/wiki/Port_of_Felixstowe" },
      signpost: { label: "Port of Felixstowe website", url: "https://www.portoffelixstowe.co.uk/" }
    },
    {
      id: "freeport", topic: "Investment incentives", priority: 3,
      title: "Freeport East",
      keywords: "freeport east tax relief incentives customs investment site business rates harwich gateway 14 stowmarket invest investor zone",
      text: "Freeport East offers targeted tax reliefs on designated tax sites at Felixstowe, Harwich and Gateway 14 near Stowmarket, plus a customs operations model that can apply anywhere within its boundary. It describes itself as part of the East Coast green energy cluster, aimed at clean energy manufacturers and investors in areas such as green hydrogen, clean maritime fuel, smart grids and offshore wind. Freeport East states that 100% of business rates generated are reinvested locally and cites a target of 13,500 new jobs.",
      more: "Freeport East says its area covers more than a thousand square kilometres and offers road and rail links, nearby airports and connections to both London and Cambridge.",
      source: { name: "Freeport East (official website)", url: "https://www.freeporteast.com/" },
      signpost: { label: "Freeport East enquiries", url: "https://www.freeporteast.com/" }
    },
    {
      id: "gateway14", topic: "Investment incentives", priority: 2,
      title: "Gateway 14, Stowmarket",
      keywords: "gateway 14 stowmarket business park innovation logistics land site development manufacturing warehouse",
      text: "Gateway 14, near Stowmarket in mid Suffolk, is one of the three Freeport East tax sites. Freeport East describes it as the largest business, innovation and logistics park in East Anglia, with opportunities for new manufacturing, research and development, and logistics facilities.",
      source: { name: "Freeport East (official website)", url: "https://www.freeporteast.com/" },
      signpost: { label: "Freeport East investment locations", url: "https://www.freeporteast.com/" }
    },
    {
      id: "offshorewind", topic: "Clean energy", priority: 3,
      title: "Offshore wind off the Suffolk coast",
      keywords: "offshore wind energy renewable turbines east anglia one two three array green clean power lowestoft bawdsey bramford net zero",
      text: "The East Anglia Array is a series of offshore wind farms in the North Sea off the East Anglian coast. East Anglia ONE (714 MW) has been fully operational since July 2020; its cables land near Bawdsey and connect to the grid at Bramford. East Anglia THREE, rated at about 1,372 MW, is under construction, and East Anglia TWO is planned about 37 km off Lowestoft.",
      more: "The wider East Anglia zone has a target capacity of up to 7.2 GW across up to six projects. East Anglia TWO and East Anglia ONE North received development consent in March 2022.",
      source: { name: "Wikipedia: East Anglia Array", url: "https://en.wikipedia.org/wiki/East_Anglia_Array" },
      signpost: { label: "ScottishPower Renewables: East Anglia projects", url: "https://www.scottishpowerrenewables.com/" }
    },
    {
      id: "sizewell", topic: "Clean energy", priority: 2,
      title: "Sizewell C",
      keywords: "sizewell c nuclear power station energy construction leiston edf reactor electricity supply chain",
      text: "Sizewell C is a nuclear power station under construction at Sizewell on the Suffolk coast, next to the existing Sizewell B station. It is planned as two EPR reactors with a combined capacity of about 3.2 GW. Its final investment decision was taken in July 2025, and it is expected to meet up to about 7% of the UK's electricity demand once complete.",
      more: "Construction was expected to take nine to twelve years. For supply-chain opportunities, the project publishes information on its own website.",
      source: { name: "Wikipedia: Sizewell C nuclear power station", url: "https://en.wikipedia.org/wiki/Sizewell_C_nuclear_power_station" },
      signpost: { label: "Sizewell C official website", url: "https://www.sizewellc.com/" }
    },
    {
      id: "adastral", topic: "Tech & innovation", priority: 3,
      title: "Adastral Park and the tech cluster",
      keywords: "adastral park bt martlesham technology tech telecoms digital innovation research science campus ict companies software",
      text: "Adastral Park is a science and technology campus at Martlesham Heath near Ipswich. It is home to BT's main research and development facility and hosts other technology companies; around 4,000 people work on the site. The campus first opened as the Post Office Research Station in 1975.",
      more: "Companies listed on site have included Openreach, Cisco, Fujitsu and other ICT firms, with around 98 high-tech companies reported in 2018.",
      source: { name: "Wikipedia: Adastral Park", url: "https://en.wikipedia.org/wiki/Adastral_Park" },
      signpost: { label: "Wikipedia: Adastral Park", url: "https://en.wikipedia.org/wiki/Adastral_Park" }
    },
    {
      id: "agrifood", topic: "Agri-food & drink", priority: 2,
      title: "Agriculture, food and drink",
      keywords: "agriculture farming food drink crops wheat barley sugar beet brewery greene king adnams birds eye lowestoft suffolk show agritech",
      text: "Suffolk is known for extensive, largely arable farming, growing crops such as winter wheat, barley, sugar beet and oilseed rape. Food and drink businesses based in the county include Greene King in Bury St Edmunds, Adnams in Southwold and a large Birds Eye factory in Lowestoft. The Suffolk Show, held each year in May in Ipswich, reflects the continuing importance of agriculture.",
      source: { name: "Wikipedia: Suffolk (Economy section)", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "Suffolk Show", url: "https://www.suffolkshow.co.uk/" }
    },
    {
      id: "newmarket", topic: "Equine sector", priority: 1,
      title: "Newmarket and horseracing",
      keywords: "newmarket horse horseracing racing equine stud tattersalls racecourse bloodstock",
      text: "Newmarket in west Suffolk is the headquarters of British horseracing. It has the country's largest cluster of training yards, the National Stud, Newmarket Racecourse, the Tattersalls bloodstock auctioneers and the National Horseracing Museum.",
      source: { name: "Wikipedia: Suffolk (Horse racing)", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "Wikipedia: Newmarket", url: "https://en.wikipedia.org/wiki/Newmarket,_Suffolk" }
    },
    {
      id: "university", topic: "Skills & education", priority: 3,
      title: "University of Suffolk and colleges",
      keywords: "university suffolk study degree students education skills college training graduates courses apprenticeships learn school talent workforce",
      text: "The University of Suffolk became an independent university with degree-awarding powers in 2016. Its central hub is in Ipswich, with other sites including Lowestoft and Bury St Edmunds, and it reported about 13,600 students in 2024/25. Further education colleges in the county include Suffolk New College, West Suffolk College, Lowestoft College and Easton & Otley College.",
      source: { name: "Wikipedia: Suffolk (Education)", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "University of Suffolk", url: "https://www.uos.ac.uk/" }
    },
    {
      id: "growthhub", topic: "Business support", priority: 3,
      title: "Free business support: New Anglia Growth Hub",
      keywords: "ai artificial intelligence adoption digital tools business support advice grants funding growth hub help start up startup small business sme finance workshop mentor adviser chamber commerce",
      text: "The New Anglia Growth Hub provides free, impartial business support across Norfolk and Suffolk, including one-to-one advice, help with grants and funding, workshops and events (with topics such as adopting AI and digital tools), and high-growth programmes. It is delivered by Norfolk County Council and Suffolk County Council and part-funded by the Department for Business and Trade. The Growth Hub reports supporting more than 15,000 local businesses as of March 2026, and can be reached on 0300 333 6536.",
      more: "Suffolk Chamber of Commerce is a long-standing partner in the Growth Hub's 'no wrong door' approach to business support.",
      source: { name: "New Anglia Growth Hub (official website)", url: "https://www.newangliagrowthhub.co.uk/" },
      source2: { name: "New Anglia Growth Hub: What support is offered to business in Suffolk?", url: "https://www.newangliagrowthhub.co.uk/what-support-is-offered-to-business-in-suffolk/" },
      signpost: { label: "New Anglia Growth Hub", url: "https://www.newangliagrowthhub.co.uk/" }
    },
    {
      id: "connectivity", topic: "Location & connectivity", priority: 2,
      title: "Location and transport links",
      keywords: "transport road rail connectivity a14 a12 london cambridge midlands travel location access airport commute links",
      text: "Suffolk sits between London, Cambridge and the North Sea. The A14 links the Port of Felixstowe and Ipswich to Cambridge and the Midlands, and the A12 runs towards London. The Felixstowe-to-Nuneaton rail freight route connects the port with the West Coast Main Line.",
      source: { name: "Wikipedia: Port of Felixstowe (Transport connections)", url: "https://en.wikipedia.org/wiki/Port_of_Felixstowe" },
      signpost: { label: "Freeport East: location", url: "https://www.freeporteast.com/" }
    },
    {
      id: "visitor", topic: "Culture & quality of life", priority: 1,
      title: "Culture, landscape and quality of life",
      keywords: "culture tourism visitor festival aldeburgh latitude snape maltings sutton hoo landscape coast heritage quality life live visit leisure",
      text: "Suffolk's coast includes parts of the Suffolk & Essex Coast & Heaths National Landscape, and the county also contains Dedham Vale and part of the Broads. Cultural highlights include the Aldeburgh Festival at Snape Maltings, the Latitude Festival at Henham Park, and the Anglo-Saxon ship burial site at Sutton Hoo.",
      source: { name: "Wikipedia: Suffolk", url: "https://en.wikipedia.org/wiki/Suffolk" },
      signpost: { label: "Wikipedia: Suffolk", url: "https://en.wikipedia.org/wiki/Suffolk" }
    },
    {
      id: "event-demo", topic: "Event information", priority: 2, illustrative: true,
      title: "This event (illustrative demo block)",
      keywords: "event stand today schedule speakers partners talk session agenda programme where meet team booth exhibition",
      text: "This is an illustrative event block showing how event-specific signposting works: before each event, staff add the stand number, speaker sessions and partner organisations here, and remove the block afterwards. In this demo, visitors who want a follow-up can leave their details using the form or scan the QR code.",
      source: { name: "92 Logics demo content (illustrative, not a real event)", url: "https://github.com/92logics/suffolk-economy-avatar-demo" },
      signpost: { label: "Leave your details for follow-up", url: "#lead" }
    },
    {
      id: "about-demo", topic: "About this assistant", priority: 1, illustrative: true,
      title: "About this demo assistant",
      keywords: "who are you what are you demo assistant avatar bot ai how work 92 logics made built",
      text: "I'm a demonstration digital ambassador built by 92 Logics for Suffolk County Council tender GHI/ED/PSR1. I answer only from a small set of approved summaries, each with its source shown, and I tell you when I don't have approved information. I'm not an official Suffolk County Council service.",
      source: { name: "92 Logics demo content", url: "https://github.com/92logics/suffolk-economy-avatar-demo" },
      signpost: { label: "Demo source code (GitHub)", url: "https://github.com/92logics/suffolk-economy-avatar-demo" }
    }
  ];
  root.KB_BASELINE = KB_BASELINE;
  if (typeof module === "object" && module.exports) module.exports = KB_BASELINE;
})(typeof window !== "undefined" ? window : globalThis);
