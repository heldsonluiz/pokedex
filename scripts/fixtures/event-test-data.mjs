import { createHash } from "node:crypto"

const asset = (origin, folder, slug) =>
  new URL(`/images/assets/${folder}/${slug}.png`, origin).toString()

function deterministicUuid(type, slug) {
  const hash = createHash("sha256")
    .update(`devfest-triangulo-2026:${type}:${slug}`)
    .digest("hex")
  const variant = ((Number.parseInt(hash[16], 16) & 0x3) | 0x8).toString(16)

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${variant}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-")
}

export const TEST_COMPANIES = [
  ["aurora-cloud", "Aurora Cloud"],
  ["byte-forge", "Byte Forge"],
  ["code-cauldron", "Code Cauldron"],
  ["data-crypt", "Data Crypt"],
  ["ghost-stack", "Ghost Stack"],
  ["neon-labs", "Neon Labs"],
  ["pixel-vault", "Pixel Vault"],
  ["runtime-studio", "Runtime Studio"],
]

export const TEST_TAGS = [
  [
    "morcego-do-build",
    "Morcego do Build",
    "Voa entre pipelines até encontrar um deploy saudável.",
  ],
  [
    "pocao-de-cache",
    "Poção de Cache",
    "Acelera sua jornada com uma dose de dados bem guardados.",
  ],
  [
    "fantasma-do-bug",
    "Fantasma do Bug",
    "Assombra o código até que o último erro seja encontrado.",
  ],
  [
    "abobora-binaria",
    "Abóbora Binária",
    "Ilumina caminhos escuros usando apenas zeros e uns.",
  ],
  [
    "gato-do-terminal",
    "Gato do Terminal",
    "Passeia silenciosamente entre comandos e atalhos.",
  ],
  [
    "slime-do-runtime",
    "Slime do Runtime",
    "Muda de forma para sobreviver a qualquer execução.",
  ],
  [
    "corvo-da-nuvem",
    "Corvo da Nuvem",
    "Leva mensagens entre serviços sem perder um pacote.",
  ],
  [
    "caveira-do-commit",
    "Caveira do Commit",
    "Guarda a história de cada mudança no repositório.",
  ],
  [
    "aranha-da-web",
    "Aranha da Web",
    "Conecta interfaces em uma teia de componentes.",
  ],
  [
    "golem-de-dados",
    "Golem de Dados",
    "Protege informações valiosas dentro da masmorra.",
  ],
  [
    "abobora-programadora",
    "Abóbora Programadora",
    "Compila feitiços e código sem sair do caldeirão.",
  ],
  [
    "android-queijo-vampiro",
    "Android Queijo Vampiro",
    "Pronto para assombrar bugs e devorar códigos noite afora.",
  ],
  [
    "bruxa-da-nuvem",
    "Bruxa da Nuvem",
    "Orquestra serviços e encantamentos direto das nuvens.",
  ],
  [
    "caveira-neon",
    "Caveira Neon",
    "Brilha no escuro para revelar segredos do sistema.",
  ],
  ["dash", "Dash", "Atento no seu deploy e veloz no seu build."],
  [
    "dinoffline",
    "Dinoffline",
    "Mesmo offline, continua correndo em busca da próxima rede.",
  ],
  [
    "dragao-do-firewall",
    "Dragão do Firewall",
    "Protege a rede contra invasores e pacotes suspeitos.",
  ],
  [
    "fantasma-do-arcade",
    "Fantasma do Arcade",
    "Assombra partidas em busca do próximo recorde.",
  ],
  [
    "morcego-cosmico",
    "Morcego Cósmico",
    "Navega por constelações de dados durante a madrugada.",
  ],
  [
    "pocao-acida",
    "Poção Ácida",
    "Dissolve bugs resistentes com uma fórmula fluorescente.",
  ],
  [
    "runa-do-runtime",
    "Runa do Runtime",
    "Mantém o ciclo da aplicação em movimento constante.",
  ],
  [
    "sparky",
    "Sparky",
    "Sempre pronto para acender ideias e impulsionar seus apps.",
  ],
]

export const TEST_MISSIONS = [
  {
    id: "qr-secreto",
    title: "Encontre o QR secreto",
    validationType: "qr",
    description: "Encontre o QR escondido próximo à área de alimentação.",
  },
  {
    id: "cacar-bug",
    title: "Cace um bug",
    validationType: "reviewer",
    description: "Resolva o desafio rápido e mostre a solução a um reviewer.",
  },
  {
    id: "visita-aurora",
    title: "Conheça a Aurora Cloud",
    validationType: "reviewer",
    description: "Visite o estande da Aurora Cloud e converse com a equipe.",
    prerequisites: [{ type: "company", activityId: "aurora-cloud" }],
  },
  {
    id: "duelo-de-codigo",
    title: "Duelo de código",
    validationType: "reviewer",
    description: "Participe de um duelo relâmpago de programação.",
  },
  {
    id: "oraculo-da-nuvem",
    title: "Consulte o Oráculo da Nuvem",
    validationType: "qr",
    description: "Descubra a resposta escondida no QR do Oráculo.",
  },
  {
    id: "trilha-do-terminal",
    title: "Trilha do Terminal",
    validationType: "qr",
    description: "Encontre o terminal perdido nos corredores do evento.",
    prerequisites: [{ type: "mission", activityId: "qr-secreto" }],
  },
  {
    id: "desafio-byte-forge",
    title: "Desafio da Byte Forge",
    validationType: "reviewer",
    description: "Conclua o desafio apresentado no estande.",
    prerequisites: [{ type: "company", activityId: "byte-forge" }],
  },
  {
    id: "ritual-do-networking",
    title: "Ritual do Networking",
    validationType: "reviewer",
    description: "Mostre ao reviewer que você criou novas conexões.",
  },
  {
    id: "mapa-das-tags",
    title: "Mapa das Tags",
    validationType: "reviewer",
    description:
      "Encontre pistas espalhadas pelo evento e apresente o mapa final.",
  },
  {
    id: "boss-final",
    title: "Boss Final",
    validationType: "reviewer",
    description: "Complete a sequência final de desafios.",
    prerequisites: [
      { type: "mission", activityId: "trilha-do-terminal" },
      { type: "mission", activityId: "desafio-byte-forge" },
    ],
  },
  {
    id: "conecte-10-participantes",
    title: "Conecte-se com 10 participantes",
    validationType: "automatic",
    description: "Crie conexões com 10 participantes diferentes do evento.",
    progressRequirement: { type: "connections", target: 10 },
  },
  {
    id: "conecte-20-participantes",
    title: "Conecte-se com 20 participantes",
    validationType: "automatic",
    description: "Amplie sua rede para 20 participantes diferentes.",
    progressRequirement: { type: "connections", target: 20 },
  },
  {
    id: "conecte-50-participantes",
    title: "Conecte-se com 50 participantes",
    validationType: "automatic",
    description: "Alcance 50 conexões diferentes durante o evento.",
    progressRequirement: { type: "connections", target: 50 },
  },
  {
    id: "visite-3-empresas",
    title: "Visite 3 empresas",
    validationType: "automatic",
    description: "Escaneie o QR Code de três empresas participantes.",
    progressRequirement: { type: "companies", target: 3 },
  },
  {
    id: "visite-todas-empresas",
    title: "Visite todas as empresas",
    validationType: "automatic",
    description: "Complete seu passaporte visitando todas as empresas ativas.",
    progressRequirement: { type: "companies", target: "all" },
  },
]

export const TEST_REWARDS = [
  {
    id: "adesivo-pixel",
    name: "Adesivo Pixel",
    description: "Adesivo holográfico com identidade gamer do evento.",
    ticketCost: 1,
    stock: 120,
  },
  {
    id: "bottom-devfest",
    name: "Bottom DevFest",
    description: "Bottom colecionável para mochila, crachá ou jaqueta.",
    ticketCost: 2,
    stock: 90,
  },
  {
    id: "chaveiro-arcade",
    name: "Chaveiro Arcade",
    description: "Chaveiro temático inspirado nos jogos clássicos.",
    ticketCost: 3,
    stock: 60,
  },
  {
    id: "ecobag-tech",
    name: "Ecobag Tech",
    description: "Ecobag reutilizável para levar os itens conquistados.",
    ticketCost: 4,
    stock: 40,
  },
  {
    id: "caneca-runtime",
    name: "Caneca Runtime",
    description: "Caneca temática para acompanhar longas sessões de código.",
    ticketCost: 6,
    stock: 25,
  },
  {
    id: "kit-endgame",
    name: "Kit Endgame",
    description: "Kit premium com itens especiais da edição do evento.",
    ticketCost: 8,
    stock: 12,
  },
]

export const TEST_RAFFLES = [
  {
    id: "smart-speaker",
    prizeName: "Smart Speaker",
    description: "Caixa de som inteligente para automações e música.",
  },
  {
    id: "headset-gamer",
    prizeName: "Headset Gamer",
    description: "Headset com microfone para jogos, reuniões e estudos.",
  },
  {
    id: "teclado-mecanico",
    prizeName: "Teclado Mecânico",
    description: "Teclado mecânico para completar o setup de desenvolvimento.",
  },
  {
    id: "smartwatch",
    prizeName: "Smartwatch",
    description: "Relógio inteligente para acompanhar rotina e atividades.",
  },
  {
    id: "monitor-ultrawide",
    prizeName: "Monitor Ultrawide",
    description: "Monitor amplo para produtividade, criação e entretenimento.",
  },
  {
    id: "cadeira-gamer",
    prizeName: "Cadeira Gamer",
    description: "Cadeira ergonômica para sessões longas no computador.",
  },
]

const speakerNames = [
  "Ada Lovelace Lima",
  "Alan Turing Souza",
  "Grace Hopper Alves",
  "Linus Torvalds Rocha",
  "Margaret Hamilton Reis",
  "Tim Berners-Lee Costa",
  "Radia Perlman Melo",
  "James Gosling Dias",
  "Barbara Liskov Nunes",
  "Guido van Rossum Silva",
  "Hedy Lamarr Santos",
  "Ken Thompson Moraes",
  "Frances Allen Freitas",
  "Donald Knuth Ribeiro",
  "Anita Borg Martins",
  "Brendan Eich Campos",
  "Mary Jackson Cardoso",
  "John Carmack Lopes",
  "Katie Bouman Teixeira",
  "Dennis Ritchie Ramos",
  "Evelyn Boyd Granville Luz",
  "Sophie Wilson Castro",
  "Mark Dean Barros",
  "Karen Spärck Jones Pinto",
  "Clarence Ellis Azevedo",
  "Jean Sammet Faria",
]

const talkTitles = [
  "Abertura: o próximo nível da comunidade",
  "IA útil sem magia negra",
  "Arquiteturas que sobrevivem ao boss final",
  "Design systems para mundos mutáveis",
  "Painel: carreiras além do código",
  "Flutter em todas as telas",
  "Observabilidade contra fantasmas",
  "Dados seguros na cripta",
  "Web moderna sem sustos",
  "Comunidades que criam futuros",
  "Cloud com custos previsíveis",
  "Acessibilidade como superpoder",
  "Painel: liderança técnica na prática",
  "APIs rápidas e resilientes",
  "Jogos, pixels e criatividade",
  "SRE durante a lua cheia",
  "Mobile offline primeiro",
  "Open source para iniciantes",
  "Produtos guiados por experimentos",
  "Segurança desde o primeiro commit",
  "DevOps sem rituais secretos",
  "Do protótipo à escala",
  "O futuro das interfaces",
  "Encerramento: juntos no endgame",
]

export function createCatalogFixture({ eventId, appOrigin, now }) {
  const companies = TEST_COMPANIES.map(([id, name]) => ({
    collection: "companies",
    id,
    data: {
      id,
      eventId,
      qrId: deterministicUuid("company", id),
      name,
      description: `${name} apresenta tecnologia, comunidade e desafios para participantes.`,
      logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`,
      stampImageUrl: null,
      active: true,
      xpAwarded: 50,
      createdAt: now,
      updatedAt: now,
    },
  }))
  const tags = TEST_TAGS.map(([id, name, description], order) => ({
    collection: "tags",
    id,
    data: {
      id,
      eventId,
      qrId: deterministicUuid("tag", id),
      name,
      description,
      imageUrl: asset(appOrigin, "tags", id),
      active: true,
      order,
      xpAwarded: 75,
      createdAt: now,
      updatedAt: now,
    },
  }))
  const missions = TEST_MISSIONS.map((mission, order) => ({
    collection: "missions",
    id: mission.id,
    data: {
      id: mission.id,
      eventId,
      qrId:
        mission.validationType === "qr"
          ? deterministicUuid("mission", mission.id)
          : null,
      title: mission.title,
      description: mission.description,
      imageUrl:
        mission.validationType === "automatic"
          ? null
          : asset(appOrigin, "missions", mission.id),
      validationType: mission.validationType,
      progressRequirement: mission.progressRequirement ?? null,
      prerequisites: mission.prerequisites ?? [],
      active: true,
      order,
      xpAwarded: 50,
      createdAt: now,
      updatedAt: now,
    },
  }))
  const rewards = TEST_REWARDS.map((reward, order) => ({
    collection: "rewards",
    id: reward.id,
    data: {
      id: reward.id,
      eventId,
      name: reward.name,
      description: reward.description,
      imageUrl: `https://api.dicebear.com/9.x/icons/svg?seed=${encodeURIComponent(reward.id)}`,
      ticketCost: reward.ticketCost,
      stock: reward.stock,
      redemptionLimit: 1,
      active: true,
      order,
      createdAt: now,
      updatedAt: now,
    },
  }))
  const raffles = TEST_RAFFLES.map((raffle, order) => ({
    collection: "raffles",
    id: raffle.id,
    data: {
      id: raffle.id,
      eventId,
      prizeName: raffle.prizeName,
      description: raffle.description,
      imageUrl: `https://api.dicebear.com/9.x/icons/svg?seed=${encodeURIComponent(raffle.id)}`,
      order,
      active: true,
      status: "pending",
      currentAttemptId: null,
      currentCandidateId: null,
      currentCandidateName: null,
      winnerId: null,
      winnerName: null,
      eligibleParticipantCount: null,
      eligibleTicketTotal: null,
      randomOffset: null,
      drawnAt: null,
      drawnBy: null,
      createdAt: now,
      updatedAt: now,
    },
  }))
  const speakers = speakerNames.map((name, index) => {
    const id = `speaker-${String(index + 1).padStart(2, "0")}`
    return {
      collection: "speakers",
      id,
      data: {
        eventId,
        name,
        company: `Tech Company ${index + 1}`,
        title: "Especialista em tecnologia",
        miniBio: `Profissional de tecnologia e comunidade, palestrante convidado para compartilhar experiências práticas.`,
        photoUrl: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
        socialMedia: { instagram: null, linkedIn: null },
        isVisible: true,
        createdAt: now,
        updatedAt: now,
      },
    }
  })
  const talks = talkTitles.map((title, index) => {
    const id = `talk-${String(index + 1).padStart(2, "0")}`
    const isOpening = index === 0
    const isClosing = index === talkTitles.length - 1
    const isMultiSpeaker = index === 4 || index === 12
    return {
      collection: "talks",
      id,
      data: {
        eventId,
        title,
        description: `Uma conversa prática sobre ${title.toLocaleLowerCase("pt-BR")}.`,
        category:
          isOpening || isClosing
            ? "Comunidade"
            : ["Web", "Mobile", "Cloud", "Carreira"][index % 4],
        format:
          isOpening || isClosing
            ? "keynote"
            : isMultiSpeaker
              ? "panel"
              : "talk",
        speakerIds: isMultiSpeaker
          ? [
              `speaker-${String(index + 1).padStart(2, "0")}`,
              `speaker-${String(index + 2).padStart(2, "0")}`,
              `speaker-${String(index + 3).padStart(2, "0")}`,
            ]
          : [`speaker-${String(index + 1).padStart(2, "0")}`],
        evaluationStatus: index < 6 ? "closed" : index < 12 ? "open" : "locked",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    }
  })
  const tracks = ["MINAS", "CURADO", "CANASTRA", "TRANCA", "COMUNIDADE"]
  const schedule = talks.map((talk, index) => {
    const startsAt = new Date(
      Date.UTC(2026, 9, 17, 11 + Math.floor(index / 4), (index % 4) * 10)
    )
    const endsAt = new Date(startsAt.getTime() + 40 * 60 * 1000)
    const id = `schedule-${String(index + 1).padStart(2, "0")}`
    const isOpening = index === 0
    const isClosing = index === talks.length - 1
    const track = isOpening || isClosing ? null : tracks[index % tracks.length]
    return {
      collection: "schedule",
      id,
      data: {
        id,
        eventId,
        startAt: startsAt,
        endAt: endsAt,
        track,
        order: track ? index % tracks.length : null,
        activity: {
          type: isOpening
            ? "opening_keynote"
            : isClosing
              ? "closing_keynote"
              : "talk",
          talkId: talk.id,
        },
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    }
  })
  return [
    ...companies,
    ...tags,
    ...missions,
    ...rewards,
    ...raffles,
    ...speakers,
    ...talks,
    ...schedule,
  ]
}
