const avatars = Array.from({ length: 50 }, (_, index) => ({
  col: index % 10,
  row: Math.floor(index / 10)
}));

let GRID_SIZE = 5;
const BET_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const FIXED_PHYSICS_STEP = window.PuckLuckMath?.FIXED_TIMESTEP || 1 / 120;
const AUTO_PLAY_ROUND_GAP_MS = 350;
const TODAY_WINS_STORAGE_PREFIX = "puckLuckTodayWinsV1";
const LANGUAGE_STORAGE_KEY = "puckLuckLanguageV1";
const SOUND_EFFECTS_STORAGE_KEY = "puckLuckSoundEffectsV1";
const ANIMATIONS_STORAGE_KEY = "puckLuckAnimationsV1";
const MUSIC_STORAGE_KEY = "puckLuckMusicV1";
const BACKGROUND_MUSIC_SRC = "assets/background-casino-jazz-loop.ogg";
const HAPTICS_STORAGE_KEY = "puckLuckHapticsV1";
const SECRET_ZONE_IDS = ["top", "right", "bottom", "left"];
const FIELD_POCKET_ZONE_ID = "field";
const BACKGROUND_MUSIC_VOLUME = 0.08;
const GAME_MECHANICS_VARIANT = document.location.pathname.endsWith("/billiard.html")
  || new URLSearchParams(window.location.search).get("mode") === "billiard"
  ? "billiard"
  : "field-pocket";
// A rare visual variant of an already-authorized pocket result. This does not change
// the mathematical pocket probability or any payout; it only selects a faster valid path.
const EARLY_POCKET_ENTRY_VISUAL_PROBABILITY = 0.08;
const PURPLE_POCKET_MULTIPLIER = 10;
const PURPLE_NEON_RENDERED_PIXEL_SOFT_LIMIT = 820000;
const PURPLE_NEON_RENDERED_PIXEL_HARD_LIMIT = 1400000;
const COLLECTIBLE_IDLE_FRAME_INTERVAL_MS = 50;
const COUNTER_FLY_IN_DURATION_MS = 360;
const RESULT_BOOST_REVEAL_DURATION_MS = 240;
const BLUE_POCKET_WAVE_TIME_SCALE_MS = 72.5;
const MAX_RESULT_SOUND_LEVELS = 9;
const WIN_SOUND_PITCH_RATIOS = [1, 1.12, 1.26, 1.42, 1.6, 1.81, 2.04, 2.28, 2.55];
const PURPLE_WIN_SOUND_PITCH_RATIOS = [1, 1.08, 1.16, 1.27, 1.4, 1.54, 1.7, 1.88, 2.08];
const LOCALES = { en: "en-US", ru: "ru-RU", es: "es-419", pt: "pt-BR", de: "de-DE", fr: "fr-FR" };
const TRANSLATIONS = {
  en: {
    balance: "Balance", changeAvatar: "Change Avatar", sound: "Game SFX", music: "Music", vibration: "Vibration", animations: "Animations", language: "Language", rules: "Rules", gameRules: "Game Rules",
    ruleLaunchTitle: "Launch and physics", ruleLaunchText: "Choose one to three balls. They launch together and bounce from the boards.",
    ruleWinsTitle: "Winning cells", ruleWinsText: "A ball wins when it stops in a multiplier cell. The value applies to that ball's stake.",
    rulePocketTitle: "Pocket", rulePocketFieldText: "One pocket appears in a random empty cell each round. A ball entering it releases three white balls. Released balls can rarely enter the pocket again; the chance decreases with each generation.", rulePocketBilliardText: "A ball entering a corner pocket releases three white balls. Released balls can rarely enter a pocket again; the chance decreases with each generation.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Collect one purple diamond per selected ball. A full set multiplies main-field wins by x10, including three-ball pocket releases.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Collect the yellow star to add extra multiplier cells to the main field.",
    ruleFieldTitle: "Lines and volatility", ruleFieldText: "Lines control volatility: fewer lines mean larger targets and smaller multipliers; more lines mean rarer hits and larger multipliers.",
    ruleAutoTitle: "Autoplay", ruleAutoText: "Autoplay repeats the current stake and ball count after each round until switched off.",
    rulesAboutTitle: "ABOUT THE GAME",
    rulesAboutIntro: "BalloroX is an online probability game with a fixed mathematical model. Choose a stake, 1–3 balls and 5–10 lines. Each ball has its own stake and can stop on an empty cell, a multiplier cell or enter a pocket that releases three white balls. A released ball can rarely enter a pocket again; the chance decreases at each generation.",
    rulesHowToWinTitle: "How wins are paid",
    rulesHowToWinText: "The round win is the sum of all ball payouts: ball stake × cell multiplier. x10 BOOST multiplies main-field wins. A ball that enters a pocket releases three white balls, and each one resolves on the main field with an ordinary cell multiplier or can rarely enter a pocket again. EX MULTI adds extra multiplier cells to the main field, but it does not guarantee a win.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "The theoretical RTP is 97.45%. RTP is the long-term average return calculated across a very large number of rounds; it does not guarantee the result of a specific bet, session or player. RTP formula: total payouts ÷ total stakes × 100%.",
    rulesMaxWinTitle: "Maximum win",
    rulesMaxWinText: "The theoretical maximum win is 8100x the total stake. It requires 10 lines, x10 BOOST, the maximum allowed chain of repeated pocket entries and every final released ball landing on a 300x multiplier. This outcome is extremely rare, but non-zero.",
    rulesVolatilityTitle: "Volatility",
    rulesVolatilityText: "More lines widen the X field and increase the available multiplier values. Premium center multipliers become larger and rarer, producing higher volatility.",
    rulesDisclosureTitle: "Player information",
    rulesDisclosureText: "Game rules disclose the RTP, maximum win and bonus conditions. BalloroX is intended for adult players. Play responsibly.",
    topUpTitle: "Top Up Balance", topUpText: "Add any amount to continue playing.", amount: "Amount", topUp: "TOP UP", cancel: "CANCEL",
    totalHistory: "HISTORY:", roundHistory: "Round History", todayTopWins: "TODAY TOP WINS", riskLevel: "RISK", lines: "LINES", low: "Low", normal: "Normal", high: "High",
    pucks: "BALLS", auto: "AUTO", bet: "BET", wait: "WAIT", round: "ROUND", livePlayers: "LIVE PROTOTYPE PLAYERS", liveSubtitle: "LOCAL SIMULATION · SHARED GAME MATH",
    player: "Player", type: "Type", riskLines: "Risk / Lines", result: "Result", payout: "Payout", status: "Status", lost: "Lost", win: "Win", avatar: "Avatar",
    showFullWinners: "Show full today top wins", showTopWinner: "Show only today's top win"
  },
  ru: {
    balance: "Баланс", changeAvatar: "Сменить аватар", sound: "Звуки игры", music: "Музыка", vibration: "Вибрация", animations: "Анимации", language: "Язык", rules: "Правила", gameRules: "Правила игры",
    ruleLaunchTitle: "Запуск и физика", ruleLaunchText: "Выберите от одного до трёх шаров. Они вылетают вместе и отскакивают от бортов.",
    ruleWinsTitle: "Выигрышные ячейки", ruleWinsText: "Шар выигрывает, остановившись в ячейке с множителем. Значение применяется к ставке этого шара.",
    rulePocketTitle: "Луза", rulePocketFieldText: "Каждый раунд одна луза появляется в случайной пустой ячейке. Попавший в неё шар выпускает три белых шара. Выпущенные шары могут редко снова попасть в лузу; шанс снижается с каждым поколением.", rulePocketBilliardText: "Попавший в угловую лузу шар выпускает три белых шара. Выпущенные шары могут редко снова попасть в лузу; шанс снижается с каждым поколением.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Соберите по одному фиолетовому алмазу на выбранный шар. Полный набор умножает выигрыши основного поля на x10, включая выпуск трёх шаров из лузы.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Соберите жёлтую звезду, чтобы добавить клетки с множителями на основное поле.",
    ruleFieldTitle: "Линии и волатильность", ruleFieldText: "Линии управляют волатильностью: меньше линий — крупнее цели и ниже множители; больше линий — реже попадания и выше множители.",
    ruleAutoTitle: "Автоигра", ruleAutoText: "Автоигра повторяет ставку и число шаров после каждого раунда, пока её не отключат.",
    rulesAboutTitle: "ОБ ИГРЕ",
    rulesAboutIntro: "BalloroX — онлайн-игра с фиксированной вероятностной математикой. Игрок выбирает ставку, от 1 до 3 шаров и 5–10 линий. Каждый шар имеет отдельную ставку и может остановиться на пустой ячейке, ячейке множителя или попасть в лузу, которая выпускает три белых шара. Выпущенный шар может редко снова попасть в лузу; вероятность снижается с каждым поколением.",
    rulesHowToWinTitle: "Как выплачиваются выигрыши",
    rulesHowToWinText: "Выигрыш раунда равен сумме выплат по всем шарам: ставка шара × множитель ячейки. x10 BOOST умножает выигрыши основного поля. Шар, попавший в лузу, выпускает три белых шара; каждый из них получает обычный множитель ячейки основного поля или может редко снова попасть в лузу. EX MULTI добавляет дополнительные множители на основное поле, но не гарантирует выигрыш.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "Теоретический RTP игры — 97,45%. RTP — долгосрочная средняя доля возврата игрокам, рассчитанная на очень большой дистанции; он не гарантирует результат конкретной ставки, сессии или игрока. Формула RTP: общая сумма выплат ÷ общая сумма ставок × 100%.",
    rulesMaxWinTitle: "Максимальный выигрыш",
    rulesMaxWinText: "Теоретический максимальный выигрыш — 8100x от общей ставки. Для него нужны 10 линий, x10 BOOST, максимально допустимая цепочка повторных попаданий в лузы и попадание всех финальных бонусных шаров на множитель 300x. Это крайне редкое, но ненулевое событие.",
    rulesVolatilityTitle: "Волатильность",
    rulesVolatilityText: "С увеличением линий X-поле расширяется, а доступные множители растут. Премиальные центральные множители становятся крупнее и реже, повышая волатильность.",
    rulesDisclosureTitle: "Информация для игрока",
    rulesDisclosureText: "В правилах раскрыты RTP, максимальный выигрыш и условия бонусов. BalloroX предназначена для совершеннолетних игроков. Играйте ответственно.",
    topUpTitle: "Пополнить баланс", topUpText: "Добавьте любую сумму, чтобы продолжить игру.", amount: "Сумма", topUp: "ПОПОЛНИТЬ", cancel: "ОТМЕНА",
    totalHistory: "ИСТОРИЯ:", roundHistory: "История раундов", todayTopWins: "ТОП ДНЯ", riskLevel: "РИСК", lines: "ЛИНИИ", low: "Низкий", normal: "Средний", high: "Высокий",
    pucks: "ШАРЫ", auto: "АВТО", bet: "СТАВКА", wait: "ЖДАТЬ", round: "РАУНД", livePlayers: "ИГРОКИ ПРОТОТИПА", liveSubtitle: "ЛОКАЛЬНАЯ СИМУЛЯЦИЯ · ОБЩАЯ МАТЕМАТИКА",
    player: "Игрок", type: "Тип", riskLines: "Риск / Линии", result: "Результат", payout: "Выплата", status: "Статус", lost: "Проигрыш", win: "Выигрыш", avatar: "Аватар",
    showFullWinners: "Показать 10 лучших выигрышей сегодня", showTopWinner: "Показать только лучший выигрыш сегодня"
  },
  es: {
    balance: "Saldo", changeAvatar: "Cambiar avatar", sound: "Efectos", music: "Música", vibration: "Vibración", animations: "Animaciones", language: "Idioma", rules: "Reglas", gameRules: "Reglas del juego",
    ruleLaunchTitle: "Lanzamiento y física", ruleLaunchText: "Elige de una a tres bolas. Salen juntas y rebotan en los bordes.",
    ruleWinsTitle: "Casillas ganadoras", ruleWinsText: "La bola gana al parar en un multiplicador. El valor se aplica a su apuesta.",
    rulePocketTitle: "Tronera", rulePocketFieldText: "En cada ronda aparece una tronera en una casilla vacía al azar. Una bola que entra libera tres bolas blancas. Estas pueden volver a entrar raramente; la probabilidad disminuye con cada generación.", rulePocketBilliardText: "Una bola que entra en una tronera de esquina libera tres bolas blancas. Estas pueden volver a entrar raramente; la probabilidad disminuye con cada generación.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Recoge un diamante morado por bola elegida. El conjunto completo multiplica los premios del campo principal por x10, incluidos los lanzamientos de tres bolas desde una tronera.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Recoge la estrella amarilla para añadir casillas multiplicadoras al campo principal.",
    ruleFieldTitle: "Líneas y volatilidad", ruleFieldText: "Las líneas controlan la volatilidad: menos líneas dan objetivos más grandes y multiplicadores menores; más líneas dan aciertos más raros y multiplicadores mayores.",
    ruleAutoTitle: "Juego automático", ruleAutoText: "Repite la apuesta y cantidad de bolas tras cada ronda hasta desactivarlo.",
    rulesAboutTitle: "SOBRE EL JUEGO",
    rulesAboutIntro: "BalloroX es un juego online de probabilidad con un modelo matemático fijo. Elige apuesta, 1–3 bolas y 5–10 líneas. Cada bola tiene su propia apuesta y puede detenerse en una casilla vacía, una casilla multiplicadora o entrar en una tronera que libera tres bolas blancas. Una bola liberada puede volver a entrar raramente; la probabilidad disminuye con cada generación.",
    rulesHowToWinTitle: "Cómo se pagan los premios",
    rulesHowToWinText: "El premio de la ronda es la suma de los pagos de todas las bolas: apuesta de la bola × multiplicador de la casilla. x10 BOOST multiplica los premios del campo principal. Una bola que entra en una tronera libera tres bolas blancas; cada una usa el multiplicador normal o puede volver a entrar raramente. EX MULTI añade multiplicadores extra, pero no garantiza un premio.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "El RTP teórico es 97,45%. El RTP es el retorno medio a largo plazo calculado sobre un número muy grande de rondas; no garantiza el resultado de una apuesta, sesión o jugador concreto. Fórmula RTP: pagos totales ÷ apuestas totales × 100%.",
    rulesMaxWinTitle: "Premio máximo",
    rulesMaxWinText: "El premio máximo teórico es 8100x la apuesta total. Requiere 10 líneas, x10 BOOST, la cadena máxima permitida de reentradas en troneras y que todas las bolas finales caigan en un multiplicador de 300x. Es extremadamente raro, pero posible.",
    rulesVolatilityTitle: "Volatilidad",
    rulesVolatilityText: "Más líneas amplían el campo X y aumentan los multiplicadores disponibles. Los multiplicadores centrales premium se vuelven mayores y más raros, elevando la volatilidad.",
    rulesDisclosureTitle: "Información para el jugador",
    rulesDisclosureText: "Las reglas muestran el RTP, el premio máximo y las condiciones de los bonos. BalloroX es para jugadores adultos. Juega con responsabilidad.",
    topUpTitle: "Recargar saldo", topUpText: "Añade cualquier importe para seguir jugando.", amount: "Importe", topUp: "RECARGAR", cancel: "CANCELAR",
    totalHistory: "HISTORIAL:", roundHistory: "Historial de rondas", todayTopWins: "TOP DE HOY", riskLevel: "RIESGO", lines: "LÍNEAS", low: "Bajo", normal: "Normal", high: "Alto",
    pucks: "BOLAS", auto: "AUTO", bet: "APOSTAR", wait: "ESPERA", round: "RONDA", livePlayers: "JUGADORES DEL PROTOTIPO", liveSubtitle: "SIMULACIÓN LOCAL · MISMA MATEMÁTICA",
    player: "Jugador", type: "Tipo", riskLines: "Riesgo / Líneas", result: "Resultado", payout: "Premio", status: "Estado", lost: "Perdió", win: "Premio", avatar: "Avatar",
    showFullWinners: "Mostrar los 10 mejores premios de hoy", showTopWinner: "Mostrar solo el mejor premio de hoy"
  },
  pt: {
    balance: "Saldo", changeAvatar: "Trocar avatar", sound: "Efeitos", music: "Música", vibration: "Vibração", animations: "Animações", language: "Idioma", rules: "Regras", gameRules: "Regras do jogo",
    ruleLaunchTitle: "Lançamento e física", ruleLaunchText: "Escolha de uma a três bolas. Elas saem juntas e ricocheteiam nas bordas.",
    ruleWinsTitle: "Células premiadas", ruleWinsText: "A bola ganha ao parar em um multiplicador. O valor é aplicado à aposta dela.",
    rulePocketTitle: "Caçapa", rulePocketFieldText: "A cada rodada, uma caçapa aparece em uma célula vazia aleatória. Uma bola que entra libera três bolas brancas. Elas podem raramente entrar de novo; a chance diminui a cada geração.", rulePocketBilliardText: "Uma bola que entra em uma caçapa de canto libera três bolas brancas. Elas podem raramente entrar de novo; a chance diminui a cada geração.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Colete um diamante roxo por bola escolhida. O conjunto completo multiplica os ganhos do campo principal por x10, incluindo lançamentos de três bolas pela caçapa.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Colete a estrela amarela para adicionar células multiplicadoras ao campo principal.",
    ruleFieldTitle: "Linhas e volatilidade", ruleFieldText: "As linhas controlam a volatilidade: menos linhas significam alvos maiores e multiplicadores menores; mais linhas significam acertos mais raros e multiplicadores maiores.",
    ruleAutoTitle: "Jogo automático", ruleAutoText: "Repete a aposta e a quantidade de bolas após cada rodada até ser desligado.",
    rulesAboutTitle: "SOBRE O JOGO",
    rulesAboutIntro: "BalloroX é um jogo online de probabilidade com modelo matemático fixo. Escolha a aposta, 1–3 bolas e 5–10 linhas. Cada bola tem sua própria aposta e pode parar em uma célula vazia, em uma célula multiplicadora ou entrar em uma caçapa que libera três bolas brancas. Uma bola liberada pode raramente entrar de novo; a chance diminui a cada geração.",
    rulesHowToWinTitle: "Como os ganhos são pagos",
    rulesHowToWinText: "O ganho da rodada é a soma dos pagamentos de todas as bolas: aposta da bola × multiplicador da célula. x10 BOOST multiplica os ganhos do campo principal. Uma bola que entra em uma caçapa libera três bolas brancas; cada uma usa o multiplicador normal ou pode raramente entrar de novo. EX MULTI adiciona multiplicadores extras, mas não garante ganho.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "O RTP teórico é 97,45%. RTP é o retorno médio de longo prazo calculado em um número muito grande de rodadas; ele não garante o resultado de uma aposta, sessão ou jogador específico. Fórmula do RTP: pagamentos totais ÷ apostas totais × 100%.",
    rulesMaxWinTitle: "Ganho máximo",
    rulesMaxWinText: "O ganho máximo teórico é 8100x a aposta total. Requer 10 linhas, x10 BOOST, a cadeia máxima permitida de reentradas nas caçapas e todas as bolas finais em um multiplicador de 300x. É extremamente raro, mas possível.",
    rulesVolatilityTitle: "Volatilidade",
    rulesVolatilityText: "Mais linhas ampliam o campo X e aumentam os multiplicadores disponíveis. Os multiplicadores centrais premium ficam maiores e mais raros, elevando a volatilidade.",
    rulesDisclosureTitle: "Informação ao jogador",
    rulesDisclosureText: "As regras informam o RTP, o ganho máximo e as condições dos bônus. BalloroX é destinado a jogadores adultos. Jogue com responsabilidade.",
    topUpTitle: "Adicionar saldo", topUpText: "Adicione qualquer valor para continuar jogando.", amount: "Valor", topUp: "ADICIONAR", cancel: "CANCELAR",
    totalHistory: "HISTÓRICO:", roundHistory: "Histórico de rodadas", todayTopWins: "TOP DE HOJE", riskLevel: "RISCO", lines: "LINHAS", low: "Baixo", normal: "Normal", high: "Alto",
    pucks: "BOLAS", auto: "AUTO", bet: "APOSTAR", wait: "AGUARDE", round: "RODADA", livePlayers: "JOGADORES DO PROTÓTIPO", liveSubtitle: "SIMULAÇÃO LOCAL · MESMA MATEMÁTICA",
    player: "Jogador", type: "Tipo", riskLines: "Risco / Linhas", result: "Resultado", payout: "Prêmio", status: "Status", lost: "Perdeu", win: "Ganho", avatar: "Avatar",
    showFullWinners: "Mostrar os 10 maiores ganhos de hoje", showTopWinner: "Mostrar apenas o maior ganho de hoje"
  },
  de: {
    balance: "Guthaben", changeAvatar: "Avatar ändern", sound: "Soundeffekte", music: "Musik", vibration: "Vibration", animations: "Animationen", language: "Sprache", rules: "Regeln", gameRules: "Spielregeln",
    ruleLaunchTitle: "Start und Physik", ruleLaunchText: "Wähle ein bis drei Bälle. Sie starten zusammen und prallen von den Banden ab.",
    ruleWinsTitle: "Gewinnfelder", ruleWinsText: "Ein Ball gewinnt auf einem Multiplikatorfeld. Der Wert gilt für seinen Einsatz.",
    rulePocketTitle: "Tasche", rulePocketFieldText: "In jeder Runde erscheint eine Tasche auf einem zufälligen leeren Feld. Ein Ball darin gibt drei weiße Bälle frei. Diese können selten erneut hineinfallen; die Chance sinkt mit jeder Generation.", rulePocketBilliardText: "Ein Ball in einer Ecktasche gibt drei weiße Bälle frei. Diese können selten erneut in eine Tasche fallen; die Chance sinkt mit jeder Generation.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Sammle einen violetten Diamanten pro Ball. Das volle Set multipliziert Hauptfeldgewinne mit x10, auch bei Freigaben von drei Bällen aus einer Tasche.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Sammle den gelben Stern, um zusätzliche Multiplikatorfelder im Hauptfeld hinzuzufügen.",
    ruleFieldTitle: "Linien und Volatilität", ruleFieldText: "Linien steuern die Volatilität: weniger Linien bedeuten größere Ziele und kleinere Multiplikatoren; mehr Linien bedeuten seltenere Treffer und größere Multiplikatoren.",
    ruleAutoTitle: "Autoplay", ruleAutoText: "Wiederholt Einsatz und Ballanzahl nach jeder Runde, bis es ausgeschaltet wird.",
    rulesAboutTitle: "ÜBER DAS SPIEL",
    rulesAboutIntro: "BalloroX ist ein Online-Wahrscheinlichkeitsspiel mit festem mathematischem Modell. Wähle Einsatz, 1–3 Bälle und 5–10 Linien. Jeder Ball hat einen eigenen Einsatz und kann auf einem leeren Feld, einem Multiplikatorfeld oder in einer Tasche landen, die drei weiße Bälle freigibt. Ein freigegebener Ball kann selten erneut in eine Tasche fallen; die Chance sinkt mit jeder Generation.",
    rulesHowToWinTitle: "Auszahlung von Gewinnen",
    rulesHowToWinText: "Der Rundengewinn ist die Summe aller Ballauszahlungen: Balleinsatz × Feldmultiplikator. x10 BOOST multipliziert Gewinne im Hauptfeld. Ein Ball in einer Tasche gibt drei weiße Bälle frei; jeder nutzt den normalen Multiplikator oder kann selten erneut in eine Tasche fallen. EX MULTI fügt zusätzliche Multiplikatoren hinzu, garantiert aber keinen Gewinn.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "Der theoretische RTP beträgt 97,45%. RTP ist die langfristige durchschnittliche Rückzahlung über sehr viele Runden; er garantiert kein Ergebnis für einen bestimmten Einsatz, eine Sitzung oder einen Spieler. RTP-Formel: Gesamtauszahlungen ÷ Gesamteinsätze × 100%.",
    rulesMaxWinTitle: "Maximalgewinn",
    rulesMaxWinText: "Der theoretische Maximalgewinn beträgt 8100x des Gesamteinsatzes. Er erfordert 10 Linien, x10 BOOST, die maximal erlaubte Kette erneuter Taschentreffer und alle finalen Bälle auf einem 300x-Multiplikator. Dies ist extrem selten, aber möglich.",
    rulesVolatilityTitle: "Volatilität",
    rulesVolatilityText: "Mehr Linien verbreitern das X-Feld und erhöhen die verfügbaren Multiplikatoren. Premium-Multiplikatoren im Zentrum werden größer und seltener, wodurch die Volatilität steigt.",
    rulesDisclosureTitle: "Spielerinformation",
    rulesDisclosureText: "Die Regeln zeigen RTP, Maximalgewinn und Bonusbedingungen. BalloroX ist für erwachsene Spieler bestimmt. Spiele verantwortungsvoll.",
    topUpTitle: "Guthaben aufladen", topUpText: "Füge einen beliebigen Betrag hinzu, um weiterzuspielen.", amount: "Betrag", topUp: "AUFLADEN", cancel: "ABBRECHEN",
    totalHistory: "VERLAUF:", roundHistory: "Rundenverlauf", todayTopWins: "TOP HEUTE", riskLevel: "RISIKO", lines: "LINIEN", low: "Niedrig", normal: "Normal", high: "Hoch",
    pucks: "BÄLLE", auto: "AUTO", bet: "SETZEN", wait: "WARTEN", round: "RUNDE", livePlayers: "LIVE-PROTOTYP-SPIELER", liveSubtitle: "LOKALE SIMULATION · GEMEINSAME MATHEMATIK",
    player: "Spieler", type: "Typ", riskLines: "Risiko / Linien", result: "Ergebnis", payout: "Auszahlung", status: "Status", lost: "Verloren", win: "Gewinn", avatar: "Avatar",
    showFullWinners: "Heutige Top 10 anzeigen", showTopWinner: "Nur heutigen Top-Gewinn anzeigen"
  },
  fr: {
    balance: "Solde", changeAvatar: "Changer d’avatar", sound: "Effets sonores", music: "Musique", vibration: "Vibration", animations: "Animations", language: "Langue", rules: "Règles", gameRules: "Règles du jeu",
    ruleLaunchTitle: "Lancement et physique", ruleLaunchText: "Choisissez une à trois boules. Elles partent ensemble et rebondissent sur les bandes.",
    ruleWinsTitle: "Cases gagnantes", ruleWinsText: "La boule gagne sur une case multiplicateur. La valeur s’applique à sa mise.",
    rulePocketTitle: "Poche", rulePocketFieldText: "À chaque manche, une poche apparaît sur une case vide aléatoire. Une boule qui y entre libère trois boules blanches. Elles peuvent rarement y entrer de nouveau ; la probabilité diminue à chaque génération.", rulePocketBilliardText: "Une boule qui entre dans une poche d’angle libère trois boules blanches. Elles peuvent rarement entrer de nouveau dans une poche ; la probabilité diminue à chaque génération.",
    ruleBoostTitle: "x10 BOOST", ruleBoostText: "Collectez un diamant violet par boule. La série complète multiplie les gains du terrain principal par x10, y compris les sorties de trois boules depuis une poche.",
    ruleMultiTitle: "EX MULTI", ruleMultiText: "Collectez l’étoile jaune pour ajouter des cases multiplicatrices sur le terrain principal.",
    ruleFieldTitle: "Lignes et volatilité", ruleFieldText: "Les lignes contrôlent la volatilité : moins de lignes donnent des cibles plus grandes et des multiplicateurs plus bas ; plus de lignes donnent des touches plus rares et des multiplicateurs plus élevés.",
    ruleAutoTitle: "Jeu automatique", ruleAutoText: "Répète la mise et le nombre de boules après chaque manche jusqu’à sa désactivation.",
    rulesAboutTitle: "À PROPOS DU JEU",
    rulesAboutIntro: "BalloroX est un jeu en ligne de probabilité avec un modèle mathématique fixe. Choisissez la mise, 1–3 boules et 5–10 lignes. Chaque boule a sa propre mise et peut s’arrêter sur une case vide, une case multiplicatrice ou entrer dans une poche qui libère trois boules blanches. Une boule libérée peut rarement entrer de nouveau dans une poche ; la probabilité diminue à chaque génération.",
    rulesHowToWinTitle: "Paiement des gains",
    rulesHowToWinText: "Le gain de la manche est la somme des paiements de toutes les boules : mise de la boule × multiplicateur de la case. x10 BOOST multiplie les gains du terrain principal. Une boule qui entre dans une poche libère trois boules blanches ; chacune utilise le multiplicateur normal ou peut rarement entrer de nouveau dans une poche. EX MULTI ajoute des multiplicateurs, mais ne garantit pas de gain.",
    rulesRtpTitle: "RTP",
    rulesRtpText: "Le RTP théorique est de 97,45 %. Le RTP est le retour moyen à long terme calculé sur un très grand nombre de manches ; il ne garantit pas le résultat d’une mise, session ou joueur précis. Formule RTP : paiements totaux ÷ mises totales × 100 %.",
    rulesMaxWinTitle: "Gain maximal",
    rulesMaxWinText: "Le gain maximal théorique est de 8100x la mise totale. Il exige 10 lignes, x10 BOOST, la chaîne maximale autorisée de nouvelles entrées en poche et toutes les boules finales sur un multiplicateur de 300x. Cet événement est extrêmement rare, mais possible.",
    rulesVolatilityTitle: "Volatilité",
    rulesVolatilityText: "Plus de lignes élargissent le champ en X et augmentent les multiplicateurs disponibles. Les multiplicateurs centraux premium deviennent plus élevés et plus rares, ce qui accroît la volatilité.",
    rulesDisclosureTitle: "Information joueur",
    rulesDisclosureText: "Les règles indiquent le RTP, le gain maximal et les conditions des bonus. BalloroX est destiné aux joueurs adultes. Jouez de manière responsable.",
    topUpTitle: "Recharger le solde", topUpText: "Ajoutez le montant de votre choix pour continuer.", amount: "Montant", topUp: "RECHARGER", cancel: "ANNULER",
    totalHistory: "HISTORIQUE :", roundHistory: "Historique des manches", todayTopWins: "TOP DU JOUR", riskLevel: "RISQUE", lines: "LIGNES", low: "Faible", normal: "Normal", high: "Élevé",
    pucks: "BOULES", auto: "AUTO", bet: "MISER", wait: "ATTENDRE", round: "MANCHE", livePlayers: "JOUEURS DU PROTOTYPE", liveSubtitle: "SIMULATION LOCALE · MÊMES MATHÉMATIQUES",
    player: "Joueur", type: "Type", riskLines: "Risque / Lignes", result: "Résultat", payout: "Gain", status: "Statut", lost: "Perdu", win: "Gain", avatar: "Avatar",
    showFullWinners: "Afficher les 10 meilleurs gains du jour", showTopWinner: "Afficher uniquement le meilleur gain du jour"
  }
};
// Keep the legacy random symbol planners below intact for one-line rollback.
const FIXED_BONUS_SYMBOL_LAYOUT = false;
const fixedBonusTrajectoryMetrics = new Map();

const state = {
  bankroll: 100000,
  avatarIndex: 0,
  language: "en",
  animationsEnabled: true,
  historyExpanded: false,
  soundEffectsMuted: false,
  musicEnabled: true,
  hapticsEnabled: true,
  audioContext: null,
  backgroundMusic: null,
  lastWallHitSoundAt: 0,
  lastWallHapticAt: 0,
  lastWinHapticAt: 0,
  lastMultiplierSoundAt: 0,
  resultSoundStep: 0,
  nextMultiplierSoundAt: 0,
  nextPocketReleaseIndex: 0,
  autoPlay: false,
  autoPlayTimer: null,
  running: false,
  launchPrepared: false,
  launchPreparedSlot: null,
  launchButtonPrimed: false,
  launchPrimeFrame: null,
  activeSlot: null,
  activeBetPerPuck: 0,
  roundWinAmount: 0,
  puckCount: 1,
  riskLevel: "low",
  layoutMode: "configurator_5",
  gameplayTestRows: [],
  crownsCollected: 0,
  x10BoostActivated: false,
  crownBonusAwarded: false,
  multiPlusActive: false,
  multiPlusToken: null,
  multiPlusPickupLog: null,
  multiPlusActivatedAt: 0,
  lastStarBoostSoundAt: 0,
  lastFrameAt: 0,
  roundId: 0,
  roundOutcome: null,
  fieldPocket: null,
  trajectoryPlans: [],
  trajectoryDiagnostics: [],
  recentTrajectoryIds: [],
  trajectoryUsage: {},
  debugPhysics: new URLSearchParams(window.location.search).get("debug") === "1",
  physicsAccumulator: 0,
  resultHistory: [],
  purpleLeaderboard: [
    { id: "seed-1", name: "Luna742", multiplier: 48, timestamp: 5 },
    { id: "seed-2", name: "Mateo081", multiplier: 32.5, timestamp: 4 },
    { id: "seed-3", name: "Sofi309", multiplier: 24, timestamp: 3 },
    { id: "seed-4", name: "Kiro503", multiplier: 18.5, timestamp: 2 },
    { id: "seed-5", name: "Mina202", multiplier: 12, timestamp: 1 },
    { id: "seed-6", name: "Diego417", multiplier: 10.5, timestamp: 0 },
    { id: "seed-7", name: "Zara615", multiplier: 9, timestamp: -1 },
    { id: "seed-8", name: "Noah274", multiplier: 7.5, timestamp: -2 },
    { id: "seed-9", name: "Camila93", multiplier: 6, timestamp: -3 },
    { id: "seed-10", name: "Leo188", multiplier: 5, timestamp: -4 }
  ],
  purpleLeaderboardExpanded: false,
  processedPurpleEvents: new Set(),
  latestPurpleLeaderboardId: null,
  field: {
    cx: 0,
    cy: 0,
    half: 0,
    grid: 0,
    puckRadius: 0,
    width: 0,
    height: 0,
    ratio: 1
  },
  pucks: [],
  settledCells: [],
  wonLines: [],
  bonusStars: [],
  starPickupLog: [],
  starBursts: [],
  starEffectFrame: null,
  counterFlyIns: [],
  counterFlyInFrame: null,
  collectibleIdleFrame: null,
  lastCollectibleIdleRenderAt: 0,
  resultRevealFrame: null,
  openSecretZones: new Set(),
  secretZoneOpenTimes: {},
  secretRoomLaunchAt: 0
};

const els = {
  soundButton: document.getElementById("soundButton"),
  menuButton: document.getElementById("menuButton"),
  menuDropdown: document.getElementById("menuDropdown"),
  menuAvatarButton: document.getElementById("menuAvatarButton"),
  menuAvatarPreview: document.getElementById("menuAvatarPreview"),
  menuSoundToggle: document.getElementById("menuSoundToggle"),
  menuMusicToggle: document.getElementById("menuMusicToggle"),
  menuHapticsToggle: document.getElementById("menuHapticsToggle"),
  menuAnimationToggle: document.getElementById("menuAnimationToggle"),
  menuLanguageButton: document.getElementById("menuLanguageButton"),
  menuRulesButton: document.getElementById("menuRulesButton"),
  rulesScreen: document.getElementById("rulesScreen"),
  closeRulesButton: document.getElementById("closeRulesButton"),
  languagePopup: document.getElementById("languagePopup"),
  closeLanguageButton: document.getElementById("closeLanguageButton"),
  avatarPopup: document.getElementById("avatarPopup"),
  closeAvatarButton: document.getElementById("closeAvatarButton"),
  avatarGrid: document.getElementById("avatarGrid"),
  topUpPopup: document.getElementById("topUpPopup"),
  confirmTopUpButton: document.getElementById("confirmTopUpButton"),
  cancelTopUpButton: document.getElementById("cancelTopUpButton"),
  topUpAmount: document.getElementById("topUpAmount"),
  bankedLoot: document.getElementById("bankedLoot"),
  brandTitle: document.querySelector(".brand h1"),
  rewardHistory: document.getElementById("rewardHistory"),
  historyPanel: document.getElementById("historyPanel"),
  historyToggle: document.getElementById("historyToggle"),
  canvas: document.getElementById("mineCanvas"),
  counterFlyInLayer: document.getElementById("counterFlyInLayer"),
  roundWinLabel: document.getElementById("roundWinLabel"),
  currentLoot: document.getElementById("currentLoot"),
  stageMultiplier: document.getElementById("stageMultiplier"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  rewardPopup: document.getElementById("rewardPopup"),
  betPanel: document.querySelector(".bet-panel"),
  gameScreen: document.getElementById("gameScreen"),
  betSlots: Array.from(document.querySelectorAll(".bet-slot")),
  puckCountButtons: Array.from(document.querySelectorAll(".puck-count-button")),
  crownCounter: document.getElementById("crownCounter"),
  multiPlusCounter: document.getElementById("multiPlusCounter"),
  pocketBonusCounter: document.getElementById("pocketBonusCounter"),
  purpleLeaderboard: document.getElementById("purpleLeaderboard"),
  purpleLeaderboardPanel: document.querySelector(".purple-leaderboard"),
  purpleLeaderboardToggle: document.getElementById("purpleLeaderboardToggle"),
  gridSizeButtons: Array.from(document.querySelectorAll("[data-grid-size]")),
  layoutModeButton: document.getElementById("layoutModeButton"),
  layoutDevPanel: document.getElementById("layoutDevPanel"),
  closeLayoutDevPanel: document.getElementById("closeLayoutDevPanel"),
  lockTestLines: document.getElementById("lockTestLines"),
  lockTestPucks: document.getElementById("lockTestPucks"),
  runLayoutTest100: document.getElementById("runLayoutTest100"),
  runLayoutTest1000: document.getElementById("runLayoutTest1000"),
  exportLayoutTest: document.getElementById("exportLayoutTest"),
  layoutTestStatus: document.getElementById("layoutTestStatus")
};
els.physicsDebug = document.getElementById("physicsDebug");
els.warningBanner = document.getElementById("warningBanner");

const ctx = els.canvas.getContext("2d");
const uiRng = window.PuckLuckMath.createRng(0x504c5543);

function t(key) {
  return TRANSLATIONS[state.language]?.[key] || TRANSLATIONS.en[key] || key;
}

function applyLocalization(language, persist = true) {
  state.language = TRANSLATIONS[language] ? language : "en";
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll(".language-options button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.language);
  });
  document.querySelector(".bank")?.setAttribute("aria-label", t("balance"));
  els.avatarGrid?.setAttribute("aria-label", t("changeAvatar"));
  if (persist) window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  updateBetButtons();
  updateRoundWinLabel();
  updatePurpleLeaderboardExpansion();
  renderAvatars();
  updateBank();
  fitBrandTitle();
  fitLocalizedUiText();
}

function setAnimationsEnabled(enabled, persist = true) {
  state.animationsEnabled = Boolean(enabled);
  document.body.classList.toggle("effects-disabled", !state.animationsEnabled);
  els.menuAnimationToggle.checked = state.animationsEnabled;
  if (!state.animationsEnabled) {
    if (state.starEffectFrame !== null) cancelAnimationFrame(state.starEffectFrame);
    if (state.counterFlyInFrame !== null) cancelAnimationFrame(state.counterFlyInFrame);
    if (state.collectibleIdleFrame !== null) cancelAnimationFrame(state.collectibleIdleFrame);
    if (state.resultRevealFrame !== null) cancelAnimationFrame(state.resultRevealFrame);
    state.starEffectFrame = null;
    state.counterFlyInFrame = null;
    state.collectibleIdleFrame = null;
    state.lastCollectibleIdleRenderAt = 0;
    state.resultRevealFrame = null;
    state.starBursts = [];
    clearCounterFlyIns();
    state.multiPlusActivatedAt = 0;
    updateCrownCounter();
    updateMultiPlusCounter();
    document.querySelectorAll(".bonus-bubble, .multi-plus-bubble, .is-new, .shake, .collapse-shake")
      .forEach((element) => element.classList.remove("bonus-bubble", "multi-plus-bubble", "is-new", "shake", "collapse-shake"));
    state.pucks.forEach((puck) => {
      if (puck.resultRevealStartedAt) puck.resultRevealStartedAt = performance.now() - 300;
      if (puck.result?.boostRevealStartedAt) {
        puck.result.boostRevealStartedAt = performance.now() - RESULT_BOOST_REVEAL_DURATION_MS - 1;
      }
    });
    render();
  } else {
    state.lastCollectibleIdleRenderAt = 0;
    startCollectibleIdleAnimation();
  }
  if (persist) window.localStorage.setItem(ANIMATIONS_STORAGE_KEY, state.animationsEnabled ? "1" : "0");
}

function randomBetween(min, max) {
  return min + uiRng.next() * (max - min);
}

function getMathConfiguration() {
  return window.PuckLuckMath?.getConfiguration(state.riskLevel, GRID_SIZE, state.puckCount, state.layoutMode) || null;
}

function getSecretRoomMultiplier() {
  return getMathConfiguration()?.secret_room?.multiplier || 50;
}

function getSecretRoomBaseMultiplier() {
  const secretRoom = getMathConfiguration()?.secret_room;
  return secretRoom?.base_multiplier || (secretRoom?.multiplier ? secretRoom.multiplier / 10 : 50);
}

function isMultiPlusVisualActive() {
  return Boolean(state.multiPlusActive);
}

function isX10BoostActive() {
  return Boolean(state.x10BoostActivated)
    || (Boolean(state.roundOutcome?.bonus_triggered) && state.crownsCollected >= getRequiredStars());
}

function isX10VisualActive() {
  return isX10BoostActive()
    || (Boolean(state.roundOutcome?.bonus_triggered) && state.crownsCollected >= getRequiredStars());
}

function createRoundSeed() {
  const testSeed = state.debugPhysics
    ? Number(new URLSearchParams(window.location.search).get("testSeed"))
    : NaN;
  if (Number.isInteger(testSeed) && testSeed >= 0 && testSeed <= 0xffffffff) {
    return testSeed >>> 0;
  }
  if (window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0];
  }
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    state.audioContext = new AudioContextClass();
  }
  return state.audioContext;
}

function createBackgroundMusicElement() {
  if (state.backgroundMusic) return state.backgroundMusic;
  const music = new Audio(BACKGROUND_MUSIC_SRC);
  music.loop = true;
  music.preload = "auto";
  music.volume = BACKGROUND_MUSIC_VOLUME;
  music.playsInline = true;
  state.backgroundMusic = music;
  return music;
}

function stopBackgroundMusic() {
  const music = state.backgroundMusic;
  if (!music) return;
  music.pause();
}

function startBackgroundMusic() {
  if (!state.musicEnabled) return;
  const music = createBackgroundMusicElement();
  music.muted = false;
  music.loop = true;
  music.volume = BACKGROUND_MUSIC_VOLUME;
  const playback = music.play();
  if (playback?.catch) {
    playback.catch(() => {
      // Browsers may require a user gesture before starting background music.
    });
  }
}

function setMusicEnabled(enabled, persist = true, allowStart = true) {
  state.musicEnabled = Boolean(enabled);
  if (els.menuMusicToggle) els.menuMusicToggle.checked = state.musicEnabled;
  if (persist) window.localStorage.setItem(MUSIC_STORAGE_KEY, state.musicEnabled ? "1" : "0");
  if (!state.musicEnabled) {
    stopBackgroundMusic();
  } else if (allowStart) {
    startBackgroundMusic();
  }
  updateMasterSoundButton();
}

function ensureBackgroundMusicAfterGesture() {
  if (state.musicEnabled) {
    startBackgroundMusic();
  }
}

function isAnyAudioEnabled() {
  return !state.soundEffectsMuted || state.musicEnabled;
}

function updateMasterSoundButton() {
  if (!els.soundButton) return;
  const enabled = isAnyAudioEnabled();
  els.soundButton.classList.toggle("is-muted", !enabled);
  els.soundButton.setAttribute("aria-label", enabled ? "Mute game audio" : "Enable game audio");
}

function setSoundEffectsEnabled(enabled, persist = true) {
  state.soundEffectsMuted = !Boolean(enabled);
  if (els.menuSoundToggle) els.menuSoundToggle.checked = !state.soundEffectsMuted;
  if (persist) window.localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, state.soundEffectsMuted ? "0" : "1");
  updateMasterSoundButton();
}

function setAllAudioEnabled(enabled) {
  setSoundEffectsEnabled(enabled);
  setMusicEnabled(enabled);
}

function canUseHaptics() {
  return state.hapticsEnabled
    && typeof navigator !== "undefined"
    && typeof navigator.vibrate === "function"
    && !document.hidden;
}

function triggerHaptic(pattern, key = "default", cooldownMs = 0) {
  if (!canUseHaptics()) return;
  const now = performance.now();
  if (key === "wall") {
    if (now - state.lastWallHapticAt < cooldownMs) return;
    state.lastWallHapticAt = now;
  } else if (key === "win") {
    if (now - state.lastWinHapticAt < cooldownMs) return;
    state.lastWinHapticAt = now;
  }
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Some browsers expose the API but reject vibration in embedded contexts.
  }
}

function playWallHaptic(speed = 0) {
  const speedFactor = clamp(speed / 1400, 0, 1);
  const duration = speedFactor > 0.78 ? 4 : 3;
  triggerHaptic(duration, "wall", 135);
}

function playMultiplierResultHaptic(bonusActive = false, delayMs = 0) {
  const pattern = bonusActive
    ? [28, 34, 46]
    : [16, 24, 22];
  window.setTimeout(() => triggerHaptic(pattern, "win", 90), Math.max(0, delayMs));
}

function setHapticsEnabled(enabled, persist = true) {
  state.hapticsEnabled = Boolean(enabled);
  if (els.menuHapticsToggle) els.menuHapticsToggle.checked = state.hapticsEnabled;
  if (!state.hapticsEnabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(0);
  }
  if (persist) window.localStorage.setItem(HAPTICS_STORAGE_KEY, state.hapticsEnabled ? "1" : "0");
}

function playWallHitSound(speed = 0) {
  playWallHaptic(speed);

  if (state.soundEffectsMuted) {
    return;
  }

  const nowMs = performance.now();
  if (nowMs - state.lastWallHitSoundAt < 55) {
    return;
  }
  state.lastWallHitSoundAt = nowMs;

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime;
  const volume = Math.min(0.2, Math.max(0.055, speed / 7200));
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(210, now);
  oscillator.frequency.exponentialRampToValueAtTime(92, now + 0.055);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(920, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function playPocketDropSound() {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const now = audio.currentTime;
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1450, now);
  filter.frequency.exponentialRampToValueAtTime(360, now + 0.34);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.42, now + 0.006);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  master.connect(filter);
  filter.connect(audio.destination);

  const impact = audio.createOscillator();
  const impactGain = audio.createGain();
  impact.type = "triangle";
  impact.frequency.setValueAtTime(185, now);
  impact.frequency.exponentialRampToValueAtTime(52, now + 0.15);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.62, now + 0.004);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.22);

  const hollow = audio.createOscillator();
  const hollowGain = audio.createGain();
  hollow.type = "sine";
  hollow.frequency.setValueAtTime(96, now + 0.025);
  hollow.frequency.exponentialRampToValueAtTime(38, now + 0.32);
  hollowGain.gain.setValueAtTime(0.0001, now + 0.025);
  hollowGain.gain.exponentialRampToValueAtTime(0.42, now + 0.045);
  hollowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  hollow.connect(hollowGain);
  hollowGain.connect(master);
  hollow.start(now + 0.025);
  hollow.stop(now + 0.4);

  const rim = audio.createOscillator();
  const rimGain = audio.createGain();
  rim.type = "square";
  rim.frequency.setValueAtTime(520, now);
  rim.frequency.exponentialRampToValueAtTime(130, now + 0.055);
  rimGain.gain.setValueAtTime(0.0001, now);
  rimGain.gain.exponentialRampToValueAtTime(0.2, now + 0.002);
  rimGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  rim.connect(rimGain);
  rimGain.connect(master);
  rim.start(now);
  rim.stop(now + 0.08);
}

function playWinSound(intensity = 1, pitchStep = 0, startDelay = 0) {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime + startDelay;
  const soundLevel = clamp(Math.round(pitchStep), 0, MAX_RESULT_SOUND_LEVELS - 1);
  const pitchRatio = WIN_SOUND_PITCH_RATIOS[soundLevel] || 1;
  const levelProgress = soundLevel / (MAX_RESULT_SOUND_LEVELS - 1);
  const master = audio.createGain();
  const toneFilter = audio.createBiquadFilter();
  const volume = Math.min(0.35, 0.18 + Math.log10(Math.max(1, intensity)) * 0.044 + levelProgress * 0.04);
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(2450 * pitchRatio, now);
  toneFilter.frequency.exponentialRampToValueAtTime(3400 * pitchRatio, now + 0.34);
  toneFilter.Q.setValueAtTime(0.46, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.018);
  master.gain.setValueAtTime(volume * 0.46, now + 0.32);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
  master.connect(toneFilter);
  toneFilter.connect(audio.destination);

  [261.63].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.018;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.006, start + 0.26);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.48);
  });

  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.058;
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.022, start + 0.18);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16 - index * 0.018, start + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.44);
  });

  [1046.5, 1318.51].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.24 + index * 0.052;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.018, start + 0.16);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.052 - index * 0.014, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.38);
  });
}

function playPurpleMultiplierWinSound(multiplier, pitchStep = 0, startDelay = 0) {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime + startDelay;
  const soundLevel = clamp(Math.round(pitchStep), 0, MAX_RESULT_SOUND_LEVELS - 1);
  const pitchRatio = PURPLE_WIN_SOUND_PITCH_RATIOS[soundLevel] || 1;
  const levelProgress = soundLevel / (MAX_RESULT_SOUND_LEVELS - 1);
  const master = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  const filter = audio.createBiquadFilter();
  const volume = Math.min(0.47, 0.3 + Math.log10(Math.max(1, multiplier)) * 0.035 + levelProgress * 0.045);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(7200, now + 0.72);
  compressor.threshold.setValueAtTime(-12, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(5, now);
  compressor.attack.setValueAtTime(0.004, now);
  compressor.release.setValueAtTime(0.18, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  master.gain.setValueAtTime(volume * 0.82, now + 0.62);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(audio.destination);

  // The purple win shares the regular C-major win motif, then climbs an
  // octave higher with a weighty impact so it is unmistakable on autoplay.
  const impact = audio.createOscillator();
  const impactGain = audio.createGain();
  impact.type = "triangle";
  impact.frequency.setValueAtTime(138 * pitchRatio, now);
  impact.frequency.exponentialRampToValueAtTime(48 * pitchRatio, now + 0.36);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.4, now + 0.008);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.58);

  [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.035 + index * 0.068;
    oscillator.type = index < 3 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.055, start + 0.2);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.21 - index * 0.014, start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55 + index * 0.025);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.72);
  });

  [1046.5, 1318.51, 1567.98, 2093].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.5 + index * 0.055;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.04, start + 0.32);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14 - index * 0.014, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.76);
  });

  const shimmer = audio.createOscillator();
  const shimmerGain = audio.createGain();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(2093 * pitchRatio, now + 0.7);
  shimmer.frequency.exponentialRampToValueAtTime(4186.01 * pitchRatio, now + 1.08);
  shimmerGain.gain.setValueAtTime(0.0001, now + 0.7);
  shimmerGain.gain.exponentialRampToValueAtTime(0.09, now + 0.76);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.34);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.start(now + 0.7);
  shimmer.stop(now + 1.38);
}

function playMultiplierResultSound(multiplier, bonusActive = false) {
  if (multiplier <= 0) return;
  const now = performance.now();
  const soundCount = Math.max(1, Math.min(
    MAX_RESULT_SOUND_LEVELS,
    state.roundOutcome?.puck_results?.length || state.puckCount || 1
  ));
  const firstPitchStep = Math.max(0, 3 - soundCount);
  const pitchStep = Math.min(MAX_RESULT_SOUND_LEVELS - 1, firstPitchStep + state.resultSoundStep);
  state.resultSoundStep += 1;
  const delayMs = Math.max(0, state.nextMultiplierSoundAt - now);
  state.nextMultiplierSoundAt = now + delayMs + 105;
  state.lastMultiplierSoundAt = now + delayMs;
  playMultiplierResultHaptic(bonusActive, delayMs);
  if (bonusActive) playPurpleMultiplierWinSound(multiplier * 10, pitchStep, delayMs / 1000);
  else playWinSound(multiplier, pitchStep, delayMs / 1000);
}

function playBonusStarSound(starStep = 1) {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const step = Math.max(1, Math.min(3, starStep));
  const now = audio.currentTime;
  const progress = (step - 1) / 2;
  const chords = {
    1: [523.25, 659.25, 880],
    2: [659.25, 880, 1174.66],
    3: [783.99, 1046.5, 1567.98]
  };
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3600 + progress * 1200, now);
  filter.Q.setValueAtTime(0.5, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.15 + progress * 0.06, now + 0.018);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.62 + progress * 0.18);
  master.connect(filter);
  filter.connect(audio.destination);

  chords[step].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * (0.064 + progress * 0.012);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (1.035 + progress * 0.02), start + 0.18);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.13 + progress * 0.05, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36 + progress * 0.12);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.42 + progress * 0.12);
  });

  const sparkle = audio.createOscillator();
  const sparkleGain = audio.createGain();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(1396.91 + progress * 520, now + 0.11);
  sparkle.frequency.exponentialRampToValueAtTime(2093 + progress * 850, now + 0.3 + progress * 0.05);
  sparkleGain.gain.setValueAtTime(0.0001, now + 0.11);
  sparkleGain.gain.exponentialRampToValueAtTime(0.032 + progress * 0.04, now + 0.145);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44 + progress * 0.14);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 0.11);
  sparkle.stop(now + 0.48 + progress * 0.16);
}

function playBonusCompleteSound() {
  state.lastStarBoostSoundAt = performance.now();
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const master = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(4600, now + 0.72);
  filter.Q.setValueAtTime(0.55, now);
  compressor.threshold.setValueAtTime(-14, now);
  compressor.knee.setValueAtTime(10, now);
  compressor.ratio.setValueAtTime(4, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.22, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.3, now + 0.025);
  master.gain.setValueAtTime(0.22, now + 0.68);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.34);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(audio.destination);

  // Bonus activation is a celebratory unlock stinger, deliberately without
  // the bass impact and cashout resolution used by multiplier win sounds.
  const lift = audio.createOscillator();
  const liftGain = audio.createGain();
  lift.type = "triangle";
  lift.frequency.setValueAtTime(220, now);
  lift.frequency.exponentialRampToValueAtTime(880, now + 0.54);
  liftGain.gain.setValueAtTime(0.0001, now);
  liftGain.gain.exponentialRampToValueAtTime(0.11, now + 0.05);
  liftGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
  lift.connect(liftGain);
  liftGain.connect(master);
  lift.start(now);
  lift.stop(now + 0.65);

  [349.23, 523.25, 698.46, 880, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.08 + index * 0.085;
    oscillator.type = index < 2 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.075, start + 0.24);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15 - index * 0.013, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.46);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.5);
  });

  [698.46, 880, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.62;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.025, start + 0.44);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.095 - index * 0.012, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.58);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.62);
  });
}

function playMultiPlusSound() {
  if (performance.now() - state.lastStarBoostSoundAt < 700 || state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  const compressor = audio.createDynamicsCompressor();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(5600, now + 0.34);
  compressor.threshold.setValueAtTime(-16, now);
  compressor.knee.setValueAtTime(8, now);
  compressor.ratio.setValueAtTime(3, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.14, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  master.gain.setValueAtTime(0.13, now + 0.3);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.64);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(audio.destination);

  [392, 523.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.055;
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.25);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14 - index * 0.018, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.44);
  });

  const ping = audio.createOscillator();
  const pingGain = audio.createGain();
  ping.type = "sine";
  ping.frequency.setValueAtTime(1567.98, now + 0.18);
  ping.frequency.exponentialRampToValueAtTime(2093, now + 0.38);
  pingGain.gain.setValueAtTime(0.0001, now + 0.18);
  pingGain.gain.exponentialRampToValueAtTime(0.07, now + 0.2);
  pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.56);
  ping.connect(pingGain);
  pingGain.connect(master);
  ping.start(now + 0.18);
  ping.stop(now + 0.58);
}

function playLaunchSound() {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  master.connect(audio.destination);

  const tone = audio.createOscillator();
  const toneGain = audio.createGain();
  const toneFilter = audio.createBiquadFilter();
  tone.type = "sine";
  tone.frequency.setValueAtTime(145, now);
  tone.frequency.exponentialRampToValueAtTime(330, now + 0.12);
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(1200, now);
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.32, now + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  tone.connect(toneFilter);
  toneFilter.connect(toneGain);
  toneGain.connect(master);
  tone.start(now);
  tone.stop(now + 0.24);

  const click = audio.createOscillator();
  const clickGain = audio.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(560, now);
  click.frequency.exponentialRampToValueAtTime(260, now + 0.045);
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.18, now + 0.004);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  click.connect(clickGain);
  clickGain.connect(master);
  click.start(now);
  click.stop(now + 0.08);
}

function formatMoney(value) {
  return `${value.toLocaleString(LOCALES[state.language] || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function formatMultiplierValue(value, maximumFractionDigits = 2, locale = null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  if (locale) {
    return numericValue.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits
    });
  }
  const fixedValue = numericValue.toFixed(maximumFractionDigits);
  return fixedValue.includes(".")
    ? fixedValue.replace(/0+$/, "").replace(/\.$/, "")
    : fixedValue;
}

function parseBet(slot) {
  const input = slot.querySelector(".bet-value");
  const value = Number.parseFloat(input.value.replace(",", "."));
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function formatStake(value) {
  return value >= 10 ? value.toFixed(0) : value.toFixed(2);
}

function getStepValue(current, direction) {
  const normalized = Math.max(BET_STEPS[0], Math.min(BET_STEPS[BET_STEPS.length - 1], current));
  if (direction > 0) {
    return BET_STEPS.find((step) => step > normalized + 0.0001) || BET_STEPS[BET_STEPS.length - 1];
  }
  return [...BET_STEPS].reverse().find((step) => step < normalized - 0.0001) || BET_STEPS[0];
}

function getWinningLines(cell) {
  const lines = [];
  if (cell.row === 0) lines.push("top");
  if (cell.col === GRID_SIZE - 1) lines.push("right");
  if (cell.row === GRID_SIZE - 1) lines.push("bottom");
  if (cell.col === 0) lines.push("left");
  return lines;
}

function formatPurpleMultiplier(value) {
  return `${formatMultiplierValue(value, 2, LOCALES[state.language] || "en-US")}x`;
}

function getTodayWinsStorageKey() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return `${TODAY_WINS_STORAGE_PREFIX}:${date}`;
}

function loadTodayWins() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(getTodayWinsStorageKey()) || "null");
    if (!Array.isArray(saved) || saved.length === 0) return;
    const valid = saved.filter((entry) => entry && typeof entry.name === "string" && Number(entry.multiplier) > 0)
      .map((entry) => ({ ...entry, multiplier: Number(entry.multiplier) }))
      .sort((a, b) => b.multiplier - a.multiplier || b.timestamp - a.timestamp)
      .slice(0, 10);
    if (valid.length) state.purpleLeaderboard = valid;
  } catch {
    // The daily board remains available in memory when storage is unavailable.
  }
}

function saveTodayWins() {
  try {
    window.localStorage.setItem(getTodayWinsStorageKey(), JSON.stringify(state.purpleLeaderboard));
  } catch {
    // Storage is optional for the local prototype.
  }
}

function renderPurpleLeaderboard() {
  if (!els.purpleLeaderboard) return;
  els.purpleLeaderboard.innerHTML = "";
  state.purpleLeaderboard.forEach((entry, index) => {
    const item = document.createElement("li");
    item.classList.toggle("is-real", entry.isReal === true);
    item.classList.toggle("is-new", entry.id === state.latestPurpleLeaderboardId);

    const rank = document.createElement("span");
    rank.className = "purple-rank";
    rank.textContent = String(index + 1);
    const name = document.createElement("span");
    name.className = "purple-player-name";
    name.textContent = entry.name;
    const value = document.createElement("strong");
    value.className = "purple-player-value";
    value.textContent = formatPurpleMultiplier(entry.multiplier);
    item.append(rank, name, value);
    els.purpleLeaderboard.append(item);
  });
}

function updatePurpleLeaderboardExpansion() {
  if (!els.purpleLeaderboardPanel || !els.purpleLeaderboardToggle) return;
  els.purpleLeaderboardPanel.classList.toggle("is-expanded", state.purpleLeaderboardExpanded);
  els.purpleLeaderboardPanel.setAttribute("aria-expanded", String(state.purpleLeaderboardExpanded));
  els.purpleLeaderboardToggle.setAttribute("aria-expanded", String(state.purpleLeaderboardExpanded));
  els.purpleLeaderboardToggle.setAttribute("aria-label",
    state.purpleLeaderboardExpanded ? t("showTopWinner") : t("showFullWinners"));
}

function addPurpleLeaderboardEntry(entry) {
  const multiplier = Number(entry.multiplier);
  if (!entry.id || !Number.isFinite(multiplier) || multiplier <= 0 || state.processedPurpleEvents.has(entry.id)) return;
  state.processedPurpleEvents.add(entry.id);
  if (state.processedPurpleEvents.size > 500) {
    state.processedPurpleEvents.delete(state.processedPurpleEvents.values().next().value);
  }

  const candidate = { ...entry, multiplier, timestamp: entry.timestamp || Date.now() };
  const previousEntry = state.purpleLeaderboard.find((item) => item.name === candidate.name);
  if (previousEntry && previousEntry.multiplier >= candidate.multiplier) return;
  const ranked = [...state.purpleLeaderboard.filter((item) => item.name !== candidate.name), candidate]
    .sort((a, b) => b.multiplier - a.multiplier || b.timestamp - a.timestamp)
    .slice(0, 10);
  if (!ranked.some((item) => item.id === candidate.id)) return;
  state.purpleLeaderboard = ranked;
  state.latestPurpleLeaderboardId = candidate.id;
  saveTodayWins();
  renderPurpleLeaderboard();
}

function setAvatarVars(element, avatar) {
  element.style.setProperty("--avatar-image", 'url("assets/igaming-avatars-50-v2.webp")');
  element.style.setProperty("--avatar-x", `${(avatar.col / 9) * 100}%`);
  element.style.setProperty("--avatar-y", `${(avatar.row / 4) * 100}%`);
  element.textContent = "";
}

function renderAvatars() {
  els.avatarGrid.innerHTML = "";
  avatars.forEach((avatar, index) => {
    const button = document.createElement("button");
    button.className = `avatar-option${index === state.avatarIndex ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `${t("avatar")} ${index + 1}`);
    setAvatarVars(button, avatar);
    button.addEventListener("click", () => {
      state.avatarIndex = index;
      syncAvatar();
      renderAvatars();
      closePopup(els.avatarPopup);
    });
    els.avatarGrid.append(button);
  });
}

function syncAvatar() {
  setAvatarVars(els.menuAvatarPreview, avatars[state.avatarIndex]);
}

function renderHistory() {
  els.rewardHistory.innerHTML = "";
  state.resultHistory.slice(0, 40).forEach((item) => {
    const span = document.createElement("span");
    const isBonus = typeof item === "object" && item?.bonus === true;
    const value = typeof item === "number" ? item : Number.parseFloat(item?.value ?? item);
    const puckCount = clamp(Number.parseInt(item?.puckCount ?? 1, 10) || 1, 1, 3);
    const color = isBonus ? getBonusMultiplierColor(item.baseValue ?? value / 10) : getMultiplierColor(value);
    span.className = "history-chip multiplier-chip";
    span.classList.toggle("bonus-win", isBonus);
    span.style.color = color;
    span.style.borderColor = withColorAlpha(color, 0.34);
    span.style.boxShadow = `0 0 ${isBonus ? 20 : 14}px ${withColorAlpha(color, isBonus ? 0.28 : 0.14)}`;
    const multiplierLabel = document.createElement("span");
    multiplierLabel.className = "history-multiplier-value";
    multiplierLabel.textContent = getMultiplierText(value);
    const puckDots = document.createElement("span");
    puckDots.className = "history-puck-dots";
    puckDots.setAttribute("aria-label", `${puckCount} puck${puckCount === 1 ? "" : "s"}`);
    for (let index = 0; index < puckCount; index += 1) {
      puckDots.append(document.createElement("i"));
    }
    span.append(multiplierLabel, puckDots);
    els.rewardHistory.append(span);
  });
}

function updateCrownCounter() {
  if (!els.crownCounter) {
    return;
  }

  const requiredStars = getRequiredStars();
  const pendingDiamonds = getPendingCounterFlyInCount("diamond");
  const visualCrownsCollected = clamp(state.crownsCollected - pendingDiamonds, 0, requiredStars);
  Array.from(els.crownCounter.children).forEach((item, index) => {
    item.classList.toggle("is-unused", index >= requiredStars);
    item.classList.toggle("filled", index < visualCrownsCollected);
  });
  const bonusCounter = els.crownCounter.closest(".crown-bonus-counter");
  const isActive = visualCrownsCollected >= requiredStars;
  bonusCounter?.classList.toggle("is-active", isActive);
  if (!isActive) {
    bonusCounter?.classList.remove("bonus-bubble");
  }
}

function updateMultiPlusCounter() {
  if (!els.multiPlusCounter) return;
  const visualMultiPlusActive = state.multiPlusActive && getPendingCounterFlyInCount("multiPlus") === 0;
  els.multiPlusCounter.classList.toggle("is-active", visualMultiPlusActive);
  if (!visualMultiPlusActive) els.multiPlusCounter.classList.remove("multi-plus-bubble");
}

function isFieldPocketBonusActive() {
  if (!usesFieldPocketMechanics() || !state.running || !state.fieldPocket) return false;
  return state.pucks.some((puck) => puck.secretRoom?.zoneId === FIELD_POCKET_ZONE_ID
    && ["capturing", "pocket_wait"].includes(puck.secretRoom.phase));
}

function updatePocketBonusCounter() {
  const counter = els.pocketBonusCounter;
  if (!counter) return;
  const isVisible = usesFieldPocketMechanics();
  const isActive = isVisible && isFieldPocketBonusActive();
  const wasActive = counter.classList.contains("is-active");
  counter.classList.toggle("hidden", !isVisible);
  counter.classList.toggle("is-active", isActive);
  if (isActive && !wasActive) {
    if (state.animationsEnabled) {
      counter.classList.remove("bonus-bubble");
      void counter.offsetWidth;
      counter.classList.add("bonus-bubble");
      counter.addEventListener("animationend", () => counter.classList.remove("bonus-bubble"), { once: true });
    }
  } else if (!isActive) {
    counter.classList.remove("bonus-bubble");
  }
}

function bubbleMultiPlusCounter() {
  if (!els.multiPlusCounter || !state.animationsEnabled) return;
  els.multiPlusCounter.classList.remove("multi-plus-bubble");
  void els.multiPlusCounter.offsetWidth;
  els.multiPlusCounter.classList.add("multi-plus-bubble");
  els.multiPlusCounter.addEventListener("animationend", () => {
    els.multiPlusCounter.classList.remove("multi-plus-bubble");
  }, { once: true });
}

function getRequiredStars() {
  return Math.max(1, Math.min(3, state.puckCount));
}

function resetDiamondBoostAfterPuckCountChange() {
  if (state.running) return;
  state.bonusStars = [];
  clearCounterFlyIns("diamond");
  state.crownsCollected = 0;
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.starPickupLog = [];
  updateCrownCounter();
}

function bubbleBonusCounter() {
  const bonusCounter = els.crownCounter?.closest(".crown-bonus-counter");
  if (!bonusCounter || !state.animationsEnabled) {
    return;
  }
  bonusCounter.classList.remove("bonus-bubble");
  void bonusCounter.offsetWidth;
  bonusCounter.classList.add("bonus-bubble");
  bonusCounter.addEventListener("animationend", () => bonusCounter.classList.remove("bonus-bubble"), { once: true });
}

function setupCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = els.canvas.getBoundingClientRect();
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));

  if (els.canvas.width !== pixelWidth) {
    els.canvas.width = pixelWidth;
  }
  if (els.canvas.height !== pixelHeight) {
    els.canvas.height = pixelHeight;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const winLabelStyle = window.getComputedStyle(els.roundWinLabel);
  const winLabelBottom = Number.parseFloat(winLabelStyle.bottom) || 18;
  const winLabelHeight = Number.parseFloat(winLabelStyle.fontSize) || 25;
  const topFieldReserve = clamp(height * 0.11, 58, 104);
  const bottomFieldReserve = winLabelBottom + winLabelHeight + clamp(height * 0.052, 30, 58);
  const verticalFieldLimit = Math.max(1, height - topFieldReserve - bottomFieldReserve);
  const maxDiamondSize = Math.min(width * 0.92, verticalFieldLimit);
  const diamondBottomAnchor = height - bottomFieldReserve;
  state.field.width = width;
  state.field.height = height;
  state.field.ratio = ratio;
  state.field.half = maxDiamondSize / (2 * Math.SQRT2);
  state.field.cx = width / 2;
  state.field.grid = (state.field.half * 2) / GRID_SIZE;
  state.field.cy = diamondBottomAnchor - maxDiamondSize / 2;
  const mathConfig = getMathConfiguration();
  state.field.puckRadius = mathConfig ? state.field.half * mathConfig.puck_radius : state.field.grid / 4;
}

function toScreen(x, y) {
  return {
    x: state.field.cx + (x - y) / Math.SQRT2,
    y: state.field.cy + (x + y) / Math.SQRT2
  };
}

function drawLine(a, b, color, width) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function getCellFromPoint(x, y) {
  const { half, grid } = state.field;
  const col = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((x + half) / grid)));
  const row = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((y + half) / grid)));
  return { col, row };
}

function drawCell(col, row, fill, stroke = null) {
  const { half, grid } = state.field;
  const x0 = -half + grid * col;
  const y0 = -half + grid * row;
  const points = [
    toScreen(x0, y0),
    toScreen(x0 + grid, y0),
    toScreen(x0 + grid, y0 + grid),
    toScreen(x0, y0 + grid)
  ];

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function getSideLinePoints(key) {
  const { half } = state.field;
  const sides = {
    top: [toScreen(-half, -half), toScreen(half, -half)],
    right: [toScreen(half, -half), toScreen(half, half)],
    bottom: [toScreen(half, half), toScreen(-half, half)],
    left: [toScreen(-half, half), toScreen(-half, -half)]
  };
  return sides[key];
}

function drawSideLine(key, color, width) {
  const points = getSideLinePoints(key);
  drawLine(points[0], points[1], color, width);
}

function drawGridLines(half, grid, color, width) {
  ctx.beginPath();
  for (let i = 1; i < GRID_SIZE; i += 1) {
    const line = -half + grid * i;
    const verticalStart = toScreen(line, -half);
    const verticalEnd = toScreen(line, half);
    const horizontalStart = toScreen(-half, line);
    const horizontalEnd = toScreen(half, line);
    ctx.moveTo(verticalStart.x, verticalStart.y);
    ctx.lineTo(verticalEnd.x, verticalEnd.y);
    ctx.moveTo(horizontalStart.x, horizontalStart.y);
    ctx.lineTo(horizontalEnd.x, horizontalEnd.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawMergedMultiplierCell(group, fill, stroke = null, strokeWidth = 2) {
  const { half, grid } = state.field;
  const x0 = -half + grid * group.col;
  const y0 = -half + grid * group.row;
  const size = grid * group.size;
  const points = [
    toScreen(x0, y0),
    toScreen(x0 + size, y0),
    toScreen(x0 + size, y0 + size),
    toScreen(x0, y0 + size)
  ];

  tracePolygon(points);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function buildMergedMultiplierCells() {
  const groups = [];
  const covered = new Set();
  const byKey = new Map();
  const sameMultiplier = (first, second) => Math.abs(first - second) < 1e-9;
  const dynamicXCenterKeys = new Set(
    state.layoutMode === "dynamic_diagonal_width"
      ? (getMathConfiguration()?.sector_definitions?.center || []).map((sector) => `${sector.col}_${sector.row}`)
      : []
  );

  const mergeSizes = GRID_SIZE === 7 && state.layoutMode === "dynamic_diagonal_width" ? [3, 2] : [2];
  for (const size of mergeSizes) {
    for (let row = 0; row <= GRID_SIZE - size; row += 1) {
      for (let col = 0; col <= GRID_SIZE - size; col += 1) {
        const keys = [];
        for (let rowOffset = 0; rowOffset < size; rowOffset += 1) {
          for (let colOffset = 0; colOffset < size; colOffset += 1) {
            keys.push(`${col + colOffset}_${row + rowOffset}`);
          }
        }
        if (keys.some((key) => covered.has(key))) continue;
        if (dynamicXCenterKeys.size && keys.some((key) => !dynamicXCenterKeys.has(key))) continue;

        const multiplier = getCellMultiplier(col, row);
        const category = getCellCategory(col, row);
        if (!multiplier) continue;
        const isMergedBlock = keys.every((key) => {
          const [cellCol, cellRow] = key.split("_").map(Number);
          return sameMultiplier(getCellMultiplier(cellCol, cellRow), multiplier)
            && getCellCategory(cellCol, cellRow) === category;
        });
        if (!isMergedBlock) continue;

        const group = { col, row, size, multiplier, category, keys };
        keys.forEach((key) => {
          covered.add(key);
          byKey.set(key, group);
        });
        groups.push(group);
      }
    }
  }

  return { groups, covered, byKey };
}

function drawMultiplierCellHighlight(mergedMultiplierCells, col, row, fill, stroke) {
  const group = mergedMultiplierCells.byKey.get(`${col}_${row}`);
  if (group) {
    drawMergedMultiplierCell(group, fill, stroke);
    return;
  }
  drawCell(col, row, fill, stroke);
}

function eraseMergedMultiplierInternalLines(groups, fill) {
  const { half, grid } = state.field;
  const eraseWidth = 5;
  const insetPx = 3;
  const addInsetSegment = (x1, y1, x2, y2) => {
    const start = toScreen(-half + grid * x1, -half + grid * y1);
    const end = toScreen(-half + grid * x2, -half + grid * y2);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const inset = Math.min(insetPx, Math.max(0, length / 2 - 0.5));
    const ux = length > 0 ? dx / length : 0;
    const uy = length > 0 ? dy / length : 0;
    ctx.moveTo(start.x + ux * inset, start.y + uy * inset);
    ctx.lineTo(end.x - ux * inset, end.y - uy * inset);
  };

  ctx.save();
  ctx.beginPath();
  groups.forEach((group) => {
    for (let offset = 1; offset < group.size; offset += 1) {
      addInsetSegment(group.col + offset, group.row, group.col + offset, group.row + group.size);
      addInsetSegment(group.col, group.row + offset, group.col + group.size, group.row + offset);
    }
  });
  ctx.strokeStyle = fill;
  ctx.lineWidth = eraseWidth;
  ctx.lineCap = "butt";
  ctx.stroke();
  ctx.restore();
}

function getSecretRoomOuterWallU() {
  const cells = getMathConfiguration()?.secret_room?.multi_plus_multiplier_cells
    || getMathConfiguration()?.secret_room?.multiplier_cells
    || [];
  const outerWall = cells.reduce((value, cell) => Math.max(value, cell.u1 || 0), 0);
  return clamp(outerWall || 0.8, 0.55, 0.92);
}

// Secret-room geometry experiment. Use "legacy_outer_tip" to restore the previous
// single-cut room shape. Keep both paths until the prototype is optimized.
const SECRET_ROOM_CORNER_CUT_MODE = "experimental_side_corner_cuts";
const SECRET_ROOM_LEGACY_CORNER_CUT_MODE = "legacy_outer_tip";
const SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS = 1;

function getLegacySecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  const outerCut = 1 - outerWallU;
  return [
    { u: 0, v: -1 },
    { u: 0, v: 1 },
    { u: outerWallU, v: outerCut },
    { u: outerWallU, v: -outerCut }
  ];
}

function chamferSecretRoomLocalPolygon(points, cornerIndexes, requestedCut) {
  if (!points?.length) return [];
  return points.flatMap((point, index) => {
    if (!cornerIndexes.includes(index)) return [{ ...point }];
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.u - point.u, previous.v - point.v);
    const nextLength = Math.hypot(next.u - point.u, next.v - point.v);
    const cut = Math.min(requestedCut, previousLength * 0.42, nextLength * 0.42);
    const toward = (target, length) => ({
      u: point.u + (target.u - point.u) * (cut / Math.max(1e-9, length)),
      v: point.v + (target.v - point.v) * (cut / Math.max(1e-9, length))
    });
    return [toward(previous, previousLength), toward(next, nextLength)];
  });
}

function getExperimentalSecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  const cellSize = 2 / GRID_SIZE;
  const sideCutU = clamp(cellSize * SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS, 0.05, outerWallU - 0.01);
  return [
    { u: sideCutU, v: -1 + sideCutU },
    { u: 0, v: -1 + sideCutU },
    { u: 0, v: 1 - sideCutU },
    { u: sideCutU, v: 1 - sideCutU },
    { u: outerWallU, v: 1 - outerWallU },
    { u: outerWallU, v: outerWallU - 1 }
  ];
}

function getSecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  if (SECRET_ROOM_CORNER_CUT_MODE === SECRET_ROOM_LEGACY_CORNER_CUT_MODE) {
    return getLegacySecretRoomLocalPolygon(outerWallU);
  }
  return getExperimentalSecretRoomLocalPolygon(outerWallU);
}

function bevelSecretRoomOuterCorner(vertices, outerWallU = getSecretRoomOuterWallU()) {
  if (!vertices?.length || vertices.length < 3) return vertices || [];
  const baseA = vertices[0];
  const baseB = vertices[1];
  const tip = vertices[2];
  const cut = 1 - outerWallU;
  const toward = (point) => ({
    x: tip.x + (point.x - tip.x) * cut,
    y: tip.y + (point.y - tip.y) * cut
  });
  return [baseA, baseB, toward(baseB), toward(baseA)];
}

function secretRoomLocalPointInZone(zone, u, v) {
  const { half } = state.field;
  return {
    x: zone.portal.x + zone.normal.x * u * half + zone.tangent.x * v * half,
    y: zone.portal.y + zone.normal.y * u * half + zone.tangent.y * v * half
  };
}

function usesFieldPocketMechanics() {
  return GAME_MECHANICS_VARIANT === "field-pocket";
}

function getFieldPocketNormalized(pocket = state.fieldPocket) {
  if (!pocket) return null;
  return {
    x: -1 + (pocket.col + 0.5) * 2 / GRID_SIZE,
    y: -1 + (pocket.row + 0.5) * 2 / GRID_SIZE
  };
}

function getFieldPocketGeometry() {
  const normalized = getFieldPocketNormalized();
  if (!normalized) return null;
  const hole = {
    x: normalized.x * state.field.half,
    y: normalized.y * state.field.half
  };
  return {
    id: FIELD_POCKET_ZONE_ID,
    normal: { x: 0, y: -1 },
    tangent: { x: 1, y: 0 },
    portal: { ...hole },
    hole,
    vertices: [],
    localPolygon: [],
    displayVertices: [],
    screenVertices: [],
    screenHole: toScreen(hole.x, hole.y),
    screenPortal: toScreen(hole.x, hole.y)
  };
}

function getSecretZoneGeometry(id) {
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    return getFieldPocketGeometry();
  }
  const { half } = state.field;
  const definitions = {
    top: {
      normal: { x: 0, y: -1 },
      tangent: { x: 1, y: 0 },
      portal: { x: -half, y: -half },
      hole: { x: -half, y: -half },
      vertices: [{ x: -half, y: -half }, { x: half, y: -half }, { x: -half, y: -half * 2 }]
    },
    right: {
      normal: { x: 1, y: 0 },
      tangent: { x: 0, y: 1 },
      portal: { x: half, y: -half },
      hole: { x: half, y: -half },
      vertices: [{ x: half, y: -half }, { x: half, y: half }, { x: half * 2, y: -half }]
    },
    bottom: {
      normal: { x: 0, y: 1 },
      tangent: { x: -1, y: 0 },
      portal: { x: half, y: half },
      hole: { x: half, y: half },
      vertices: [{ x: half, y: half }, { x: -half, y: half }, { x: half, y: half * 2 }]
    },
    left: {
      normal: { x: -1, y: 0 },
      tangent: { x: 0, y: -1 },
      portal: { x: -half, y: half },
      hole: { x: -half, y: half },
      vertices: [{ x: -half, y: half }, { x: -half, y: -half }, { x: -half * 2, y: half }]
    }
  };
  const zone = definitions[id] || definitions.top;
  const outerWallU = getSecretRoomOuterWallU();
  const localPolygon = getSecretRoomLocalPolygon(outerWallU);
  const displayVertices = localPolygon.map((point) => secretRoomLocalPointInZone(zone, point.u, point.v));
  return {
    id,
    ...zone,
    outerWallU,
    localPolygon,
    displayVertices,
    screenVertices: displayVertices.map((point) => toScreen(point.x, point.y)),
    screenHole: toScreen(zone.hole.x, zone.hole.y),
    screenPortal: toScreen(zone.portal.x, zone.portal.y)
  };
}

function tracePolygon(points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function traceRoundedPolygon(points, radius = 0) {
  if (!radius || points.length < 3) {
    tracePolygon(points);
    return;
  }

  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y);
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y);
    const offset = Math.min(radius, previousLength * 0.2, nextLength * 0.2);
    return {
      point,
      entry: {
        x: point.x + ((previous.x - point.x) / previousLength) * offset,
        y: point.y + ((previous.y - point.y) / previousLength) * offset
      },
      exit: {
        x: point.x + ((next.x - point.x) / nextLength) * offset,
        y: point.y + ((next.y - point.y) / nextLength) * offset
      }
    };
  });

  ctx.beginPath();
  ctx.moveTo(corners[0].exit.x, corners[0].exit.y);
  for (let index = 1; index <= corners.length; index += 1) {
    const corner = corners[index % corners.length];
    ctx.lineTo(corner.entry.x, corner.entry.y);
    ctx.quadraticCurveTo(
      corner.point.x,
      corner.point.y,
      corner.exit.x,
      corner.exit.y
    );
  }
  ctx.closePath();
}

function getPurpleNeonPerformanceScale() {
  const renderedPixels = state.field.width * state.field.height * Math.max(1, state.field.ratio) ** 2;
  if (renderedPixels >= PURPLE_NEON_RENDERED_PIXEL_HARD_LIMIT) return 0.48;
  if (renderedPixels >= PURPLE_NEON_RENDERED_PIXEL_SOFT_LIMIT) return 0.58;
  return 0.68;
}

function drawPurpleNeonPolygonStroke(points, baseWidth = 9, cornerRadius = 0) {
  const neonScale = getPurpleNeonPerformanceScale();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  [
    { width: baseWidth + 10, blur: 12, alpha: 0.11 },
    { width: baseWidth + 3, blur: 5, alpha: 0.22 }
  ].forEach((layer) => {
    traceRoundedPolygon(points, cornerRadius);
    ctx.strokeStyle = `rgba(204, 124, 255, ${layer.alpha * neonScale})`;
    ctx.lineWidth = layer.width;
    ctx.shadowColor = `rgba(202, 104, 255, ${0.62 * neonScale})`;
    ctx.shadowBlur = Math.max(2, layer.blur * neonScale);
    ctx.stroke();
  });
  ctx.restore();
}

function drawPurpleNeonPocketGlow(point, radius) {
  const neonScale = getPurpleNeonPerformanceScale();
  const glow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.72,
    point.x,
    point.y,
    radius * 1.95
  );
  glow.addColorStop(0, `rgba(226, 172, 255, ${0.055 * neonScale})`);
  glow.addColorStop(0.42, `rgba(202, 104, 255, ${0.075 * neonScale})`);
  glow.addColorStop(0.75, `rgba(166, 72, 226, ${0.035 * neonScale})`);
  glow.addColorStop(1, "rgba(130, 46, 200, 0)");

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.restore();
}

function drawPurpleNeonMultiplierText(text, x, y, color) {
  const neonScale = getPurpleNeonPerformanceScale();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.shadowColor = `rgba(202, 104, 255, ${0.46 * neonScale})`;
  ctx.shadowBlur = Math.max(2, 7 * neonScale);
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(187, 91, 255, ${0.18 * neonScale})`;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = `rgba(202, 104, 255, ${0.42 * neonScale})`;
  ctx.shadowBlur = Math.max(2, 5 * neonScale);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function secretRoomLocalPoint(zone, u, v) {
  const { half } = state.field;
  return {
    x: zone.portal.x + zone.normal.x * u * half + zone.tangent.x * v * half,
    y: zone.portal.y + zone.normal.y * u * half + zone.tangent.y * v * half
  };
}

function createFieldBorderGradient(corners, bonusGridActive) {
  const gradient = ctx.createLinearGradient(corners[3].x, corners[3].y, corners[1].x, corners[1].y);
  gradient.addColorStop(0, bonusGridActive ? "#4c2a61" : "#096a3a");
  gradient.addColorStop(0.5, bonusGridActive ? "#8454ae" : "#20b36c");
  gradient.addColorStop(1, bonusGridActive ? "#5d3774" : "#0b7b44");
  return gradient;
}

function getFieldCornerRadius() {
  // Visual-only rounding; collision coordinates and trajectory targets stay unchanged.
  return Math.min(10, Math.max(4, state.field.grid * 0.16));
}

function getSecretRoomMultiplierCells(multiPlusActive = false) {
  const config = getMathConfiguration();
  if (config?.secret_room) {
    return multiPlusActive
      ? config.secret_room.multi_plus_multiplier_cells
      : config.secret_room.multiplier_cells;
  }
  return [{ u0: 0.4, u1: 0.8, v0: -0.2, v1: 0.2, u: 0.6, v: 0, key: "fallback" }];
}

function drawSecretMultiplierCell(zone, bonusGridActive) {
  const cells = getSecretRoomMultiplierCells(isMultiPlusVisualActive());
  const multiplier = getSecretRoomMultiplier();
  const baseMultiplier = getSecretRoomBaseMultiplier();
  const displayedMultiplier = multiplier;
  const multiplierColor = getBonusMultiplierColor(baseMultiplier);

  const label = getFieldMultiplierText(displayedMultiplier, "center");
  cells.forEach((cell) => {
    const center = secretRoomLocalPoint(zone, cell.u, cell.v);
    const screenCenter = toScreen(center.x, center.y);
    let fontSize = Math.max(11, Math.min(34, state.field.grid * 0.38));
    ctx.fillStyle = multiplierColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(label).width > state.field.grid * 0.92 && fontSize > 9) {
      fontSize -= 1;
      ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    }
    drawPurpleNeonMultiplierText(label, screenCenter.x, screenCenter.y, multiplierColor);
  });
}

function getSecretRoomCellAtPoint(zone, x, y) {
  const { half } = state.field;
  const dx = x - zone.portal.x;
  const dy = y - zone.portal.y;
  const u = (dx * zone.normal.x + dy * zone.normal.y) / half;
  const v = (dx * zone.tangent.x + dy * zone.tangent.y) / half;
  const size = 2 / GRID_SIZE;
  const uIndex = clamp(Math.floor(u / size), 0, Math.ceil(1 / size) - 1);
  const vIndex = clamp(Math.floor((v + 1) / size), 0, GRID_SIZE - 1);
  return {
    u0: uIndex * size,
    u1: (uIndex + 1) * size,
    v0: -1 + vIndex * size,
    v1: -1 + (vIndex + 1) * size
  };
}

function drawSecretRoomCell(zone, cell, fill, stroke) {
  const points = [
    secretRoomLocalPoint(zone, cell.u0, cell.v0),
    secretRoomLocalPoint(zone, cell.u1, cell.v0),
    secretRoomLocalPoint(zone, cell.u1, cell.v1),
    secretRoomLocalPoint(zone, cell.u0, cell.v1)
  ].map((point) => toScreen(point.x, point.y));
  tracePolygon(points);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSecretRoomPuckCells(zone) {
  state.pucks.forEach((puck) => {
    if (puck.secretRoom?.zoneId !== zone.id) return;
    const isMoving = puck.secretRoom.phase === "inside" && !puck.stopped;
    const isWinning = puck.secretRoom.phase === "settled" && (puck.result?.multiplier || 0) > 0;
    if (!isMoving && !isWinning) return;
    const cell = getSecretRoomCellAtPoint(zone, puck.x, puck.y);
    if (isWinning) {
      drawSecretRoomCell(zone, cell, "rgba(255, 213, 77, 0.62)", "rgba(255, 213, 77, 0.98)");
      drawSecretRoomCell(zone, cell, "rgba(255, 245, 166, 0.18)", "rgba(255, 245, 166, 0.92)");
    } else {
      drawSecretRoomCell(zone, cell, "rgba(117, 217, 255, 0.26)", "rgba(117, 217, 255, 0.54)");
    }
  });
}

function drawSecretRoom(zone, bonusGridActive, innerGridColor, borderGradient) {
  if (!state.openSecretZones.has(zone.id)) return;
  const openedAt = state.secretZoneOpenTimes[zone.id] || 0;
  const reveal = clamp((performance.now() - openedAt) / 420, 0, 1);

  ctx.save();
  ctx.globalAlpha = 0.12 + reveal * 0.88;
  tracePolygon(zone.screenVertices);
  ctx.fillStyle = bonusGridActive ? "#14091b" : "#05070c";
  ctx.fill();
  ctx.clip();

  ctx.beginPath();
  const roomCellSize = 2 / GRID_SIZE;
  for (let u = 0; u <= 1 + 1e-9; u += roomCellSize) {
    const start = secretRoomLocalPoint(zone, u, -1);
    const end = secretRoomLocalPoint(zone, u, 1);
    const screenStart = toScreen(start.x, start.y);
    const screenEnd = toScreen(end.x, end.y);
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
  }
  for (let v = -1; v <= 1 + 1e-9; v += roomCellSize) {
    const start = secretRoomLocalPoint(zone, 0, v);
    const end = secretRoomLocalPoint(zone, 1, v);
    const screenStart = toScreen(start.x, start.y);
    const screenEnd = toScreen(end.x, end.y);
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
  }
  ctx.strokeStyle = innerGridColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  drawSecretRoomPuckCells(zone);
  ctx.restore();

  if (bonusGridActive) {
    drawPurpleNeonPolygonStroke(zone.screenVertices, 10);
  }
  tracePolygon(zone.screenVertices);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.stroke();
  drawSecretMultiplierCell(zone, bonusGridActive);
}

function drawWhiteReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.18,
    point.x,
    point.y,
    readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(255, 255, 255, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(245, 248, 255, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(220, 230, 242, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(210, 222, 238, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlueReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.18,
    point.x,
    point.y,
    readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(190, 240, 255, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(117, 217, 255, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(70, 177, 230, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(50, 150, 215, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(117, 217, 255, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPurpleReadyWaves(point, radius, pulse) {
  const glowRadius = radius * (2.45 + pulse * 0.42);
  const glow = ctx.createRadialGradient(point.x, point.y, radius * 0.18, point.x, point.y, glowRadius);
  glow.addColorStop(0, `rgba(239, 202, 255, ${0.5 + pulse * 0.24})`);
  glow.addColorStop(0.34, `rgba(202, 104, 255, ${0.32 + pulse * 0.2})`);
  glow.addColorStop(0.7, `rgba(136, 52, 212, ${0.14 + pulse * 0.12})`);
  glow.addColorStop(1, "rgba(120, 35, 190, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.52 + pulse * 0.2), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(226, 172, 255, ${0.58 + pulse * 0.34})`;
  ctx.lineWidth = Math.max(1.8, radius * 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawSecretPocketVortex(point, radius) {
  const time = performance.now() * 0.0012;
  const segments = 14;
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.86, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(point.x, point.y);
  ctx.rotate(time);
  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * Math.PI * 2;
    const end = ((index + 1.15) / segments) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.88, start, end);
    ctx.closePath();
    ctx.fillStyle = index % 2 === 0
      ? "rgba(145, 63, 214, 0.82)"
      : "rgba(1, 2, 8, 0.96)";
    ctx.fill();
  }
  ctx.rotate(-time * 1.65);
  ctx.lineCap = "round";
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.beginPath();
    const spiralRadius = radius * (0.28 + ring * 0.18);
    ctx.arc(0, 0, spiralRadius, time + ring * 1.8, time + ring * 1.8 + Math.PI * 1.15);
    ctx.strokeStyle = `rgba(220, 160, 255, ${0.28 - ring * 0.05})`;
    ctx.lineWidth = Math.max(1.2, radius * 0.055);
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.52);
  core.addColorStop(0, "rgba(0, 0, 0, 0.95)");
  core.addColorStop(0.46, "rgba(40, 10, 61, 0.62)");
  core.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSecretPocket(zone, pocketStrokeColor, bonusGridActive = false, outerGlowColor = null,
  pulseInnerEdge = false) {
  const { puckRadius } = state.field;
  const point = zone.screenHole;
  const pulseSeed = 4.8 + zone.hole.x * 0.007 + zone.hole.y * 0.011;
  const collectibleBubble = pulseInnerEdge ? getCollectibleIdleBubble(pulseSeed) : null;
  const pocketScale = pulseInnerEdge
    ? 1 + (collectibleBubble.scale - 1) * 0.35
    : 1;
  const isPreparing = state.pucks.some((puck) => puck.secretRoom?.zoneId === zone.id
    && ["capturing", "pocket_wait"].includes(puck.secretRoom.phase));
  const radius = Math.max(6, puckRadius * pocketScale);
  const activePocketStrokeColor = isPreparing
    ? usesFieldPocketMechanics()
      ? "rgba(117, 217, 255, 0.98)"
      : "rgba(255, 255, 255, 0.98)"
    : bonusGridActive
      ? "rgba(202, 104, 255, 0.98)"
      : pocketStrokeColor;

  ctx.save();
  if (isPreparing) {
    if (usesFieldPocketMechanics()) {
      const pulse = 0.5 + Math.sin(performance.now() / BLUE_POCKET_WAVE_TIME_SCALE_MS) * 0.5;
      drawBlueReadyWaves(point, radius, pulse);
    } else {
      const pulse = 0.5 + Math.sin(performance.now() / 145) * 0.5;
      drawWhiteReadyWaves(point, radius, pulse);
    }
  } else if (bonusGridActive) {
    drawPurpleNeonPocketGlow(point, radius);
  }
  const hole = ctx.createRadialGradient(
    point.x - radius * 0.24,
    point.y - radius * 0.28,
    radius * 0.08,
    point.x,
    point.y,
    radius
  );
  hole.addColorStop(0, "#090b10");
  hole.addColorStop(0.48, "#010205");
  hole.addColorStop(1, "#000000");
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = hole;
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = radius * 0.45;
  ctx.fill();
  ctx.shadowBlur = 0;
  if (pulseInnerEdge) {
    const pulse = clamp((collectibleBubble.glowAlpha - 0.9) / 0.52, 0, 1);
    const glowAlpha = (0.26 + pulse * 0.19) * 0.8;
    const glowBandInnerRadius = Math.max(0, radius * 0.98 - 8 * 1.2);
    const innerGlow = ctx.createRadialGradient(
      point.x,
      point.y,
      glowBandInnerRadius,
      point.x,
      point.y,
      radius * 0.98
    );
    innerGlow.addColorStop(0, "rgba(117, 217, 255, 0)");
    innerGlow.addColorStop(0.35, `rgba(117, 217, 255, ${glowAlpha * 0.1})`);
    innerGlow.addColorStop(0.65, `rgba(117, 217, 255, ${glowAlpha * 0.52})`);
    innerGlow.addColorStop(0.84, `rgba(117, 217, 255, ${glowAlpha * 0.78})`);
    innerGlow.addColorStop(1, `rgba(205, 245, 255, ${glowAlpha})`);
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.965, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.965, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.67, 0, Math.PI * 2);
    ctx.lineWidth = Math.min(8, radius * (0.4 + pulse * 0.1) * 1.2);
    ctx.strokeStyle = `rgba(117, 217, 255, ${glowAlpha * 0.7})`;
    ctx.shadowColor = `rgba(117, 217, 255, ${(0.41 + pulse * 0.08) * 0.8})`;
    ctx.shadowBlur = Math.min(8, radius * (0.62 + pulse * 0.28) * 1.2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = activePocketStrokeColor;
  ctx.lineWidth = 4;
  if (outerGlowColor) {
    ctx.shadowColor = outerGlowColor;
    ctx.shadowBlur = Math.max(4, radius * 0.34);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSecretPocketRimsOverlay() {
  const bonusGridActive = state.crownsCollected >= getRequiredStars();
  const radius = Math.max(6, state.field.puckRadius);
  SECRET_ZONE_IDS.map(getSecretZoneGeometry).forEach((zone) => {
    const isPreparing = state.pucks.some((puck) => puck.secretRoom?.zoneId === zone.id
      && puck.secretRoom.phase === "pocket_wait");
    ctx.save();
    ctx.beginPath();
    ctx.arc(zone.screenHole.x, zone.screenHole.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isPreparing
      ? usesFieldPocketMechanics()
        ? "rgba(117, 217, 255, 0.98)"
        : "rgba(255, 255, 255, 0.98)"
      : bonusGridActive
        ? "rgba(202, 104, 255, 0.98)"
        : "rgba(27, 184, 102, 0.62)";
    ctx.lineWidth = 4;
    if (bonusGridActive && !isPreparing) {
      ctx.shadowColor = "rgba(202, 104, 255, 0.7)";
      ctx.shadowBlur = Math.max(3, radius * 0.35);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawSecretRooms(bonusGridActive, innerGridColor, borderGradient) {
  const zones = SECRET_ZONE_IDS.map(getSecretZoneGeometry);
  zones.forEach((zone) => drawSecretRoom(zone, bonusGridActive, innerGridColor, borderGradient));
  return zones;
}

function puckIsUsingSecretRoom(puck) {
  const phase = puck.secretRoom?.phase;
  return ["capturing", "pocket_wait", "pocket"].includes(phase);
}

function drawMainFieldMultiplierLabels(mergedMultiplierCells, bonusGridActive, half, grid) {
  mergedMultiplierCells.groups.forEach((group) => {
    const center = toScreen(
      -half + grid * group.col + grid * group.size / 2,
      -half + grid * group.row + grid * group.size / 2
    );
    const reveal = group.category === "multi_plus"
      ? getMultiplierRevealMotion(state.multiPlusActivatedAt, center.y)
      : { y: center.y, alpha: 1 };
    const displayedMultiplier = bonusGridActive ? group.multiplier * 10 : group.multiplier;
    const text = getFieldMultiplierText(displayedMultiplier, group.category);
    const maxTextWidth = grid * group.size * 1.02;
    let fontSize = Math.max(18, Math.min(78, grid * group.size * 0.41));
    const multiplierColor = bonusGridActive
      ? getBonusMultiplierColor(group.multiplier)
      : getMultiplierColor(group.multiplier);
    ctx.fillStyle = multiplierColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(text).width > maxTextWidth && fontSize > 12) {
      fontSize -= 1;
      ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    }
    ctx.save();
    const hasPuck = state.pucks.some((puck) => {
      if (puckIsUsingSecretRoom(puck)) return false;
      const puckCell = getCellFromPoint(puck.x, puck.y);
      return puckCell.col >= group.col
        && puckCell.col < group.col + group.size
        && puckCell.row >= group.row
        && puckCell.row < group.row + group.size;
    });
    ctx.globalAlpha = (bonusGridActive || hasPuck ? 1 : 0.5) * reveal.alpha;
    if (bonusGridActive) {
      drawPurpleNeonMultiplierText(text, center.x, reveal.y, multiplierColor);
    } else {
      ctx.fillText(text, center.x, reveal.y);
    }
    ctx.restore();
  });

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (mergedMultiplierCells.covered.has(`${col}_${row}`)) {
        continue;
      }
      const multiplier = getCellMultiplier(col, row);
      if (!multiplier) {
        continue;
      }

      const center = toScreen(
        -half + grid * col + grid / 2,
        -half + grid * row + grid / 2
      );
      const category = getCellCategory(col, row);
      const reveal = category === "multi_plus"
        ? getMultiplierRevealMotion(state.multiPlusActivatedAt, center.y)
        : { y: center.y, alpha: 1 };
      const displayedMultiplier = bonusGridActive ? multiplier * 10 : multiplier;
      const text = getFieldMultiplierText(displayedMultiplier, category);
      const maxTextWidth = grid * 1.02;
      let fontSize = Math.max(10, Math.min(42, grid * 0.42));
      const multiplierColor = bonusGridActive ? getBonusMultiplierColor(multiplier) : getMultiplierColor(multiplier);
      ctx.fillStyle = multiplierColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      while (ctx.measureText(text).width > maxTextWidth && fontSize > 9) {
        fontSize -= 1;
        ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      }
      ctx.save();
      const hasPuck = state.pucks.some((puck) => {
        if (puckIsUsingSecretRoom(puck)) return false;
        const puckCell = getCellFromPoint(puck.x, puck.y);
        return puckCell.col === col && puckCell.row === row;
      });
      ctx.globalAlpha = (bonusGridActive || hasPuck ? 1 : 0.5) * reveal.alpha;
      if (bonusGridActive) {
        drawPurpleNeonMultiplierText(text, center.x, reveal.y, multiplierColor);
      } else {
        ctx.fillText(text, center.x, reveal.y);
      }
      ctx.restore();
    }
  }
}

function drawField() {
  const { half, grid } = state.field;
  const bonusGridActive = state.crownsCollected >= getRequiredStars();
  const innerGridColor = bonusGridActive ? "rgba(190, 124, 234, 0.46)" : "rgba(27, 184, 102, 0.28)";
  const corners = [
    toScreen(-half, -half),
    toScreen(half, -half),
    toScreen(half, half),
    toScreen(-half, half)
  ];

  ctx.clearRect(0, 0, state.field.width, state.field.height);
  ctx.fillStyle = "#010205";
  ctx.fillRect(0, 0, state.field.width, state.field.height);

  const borderGradient = createFieldBorderGradient(corners, bonusGridActive);
  const secretZones = usesFieldPocketMechanics()
    ? [getFieldPocketGeometry()].filter(Boolean)
    : SECRET_ZONE_IDS.map(getSecretZoneGeometry);
  const cornerRadius = getFieldCornerRadius();

  ctx.save();
  traceRoundedPolygon(corners, cornerRadius);
  ctx.fillStyle = bonusGridActive ? "#14091b" : "#05070c";
  ctx.fill();
  ctx.clip();

  for (let i = 0; i < 18; i += 1) {
    const alpha = 0.02 + i * 0.002;
    const offset = -half + (i / 17) * half * 2;
    drawLine(toScreen(-half, offset), toScreen(half, offset), `rgba(117, 217, 255, ${alpha})`, 1);
  }

  drawGridLines(half, grid, innerGridColor, 4);
  const mergedMultiplierCells = buildMergedMultiplierCells();
  const fieldFill = bonusGridActive ? "#14091b" : "#05070c";
  eraseMergedMultiplierInternalLines(mergedMultiplierCells.groups, fieldFill);

  state.pucks.forEach((puck) => {
    if (puck.stopped || puckIsUsingSecretRoom(puck)) {
      return;
    }
    const cell = getCellFromPoint(puck.x, puck.y);
    if (puck.purpleBoost) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(202, 104, 255, 0.38)",
        "rgba(226, 172, 255, 0.92)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(130, 46, 200, 0.22)",
        "rgba(202, 104, 255, 0.68)"
      );
      return;
    }
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(117, 217, 255, 0.26)",
      "rgba(117, 217, 255, 0.54)"
    );
  });

  state.settledCells.forEach((cell) => {
    if (!cell.squareWin) return;
    if (cell.purpleBoost) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(202, 104, 255, 0.56)",
        "rgba(238, 202, 255, 0.98)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(130, 46, 200, 0.24)",
        "rgba(202, 104, 255, 0.86)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 213, 77, 0.62)",
        "rgba(255, 213, 77, 0.98)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 245, 166, 0.18)",
        "rgba(255, 245, 166, 0.92)"
      );
      if (cell.lineWin) {
        drawMultiplierCellHighlight(
          mergedMultiplierCells,
          cell.col,
          cell.row,
          "rgba(255, 213, 77, 0.42)",
          "rgba(255, 238, 122, 0.98)"
        );
      }
      return;
    }
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(255, 213, 77, 0.62)",
      "rgba(255, 213, 77, 0.98)"
    );
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(255, 245, 166, 0.18)",
      "rgba(255, 245, 166, 0.92)"
    );
    if (cell.squareWin && cell.lineWin) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 213, 77, 0.42)",
        "rgba(255, 238, 122, 0.98)"
      );
    }
  });

  ctx.restore();

  traceRoundedPolygon(corners, cornerRadius);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  if (bonusGridActive) {
    drawPurpleNeonPolygonStroke(corners, 9, cornerRadius);
  }
  if (usesFieldPocketMechanics()) {
    secretZones.forEach((zone) => drawSecretPocket(
      zone,
      "rgb(117, 217, 255)",
      false,
      "rgba(117, 217, 255, 0.29)",
      true
    ));
  } else {
    secretZones.forEach((zone) => drawSecretPocket(zone, "rgba(27, 184, 102, 0.62)", bonusGridActive));
    drawSecretPocketRimsOverlay();
  }
}

function getRiskBands() {
  const mathConfig = getMathConfiguration();
  if (mathConfig) {
    return {
      outer: mathConfig.multiplier_table.outer,
      mid: mathConfig.multiplier_table.middle,
      center: mathConfig.multiplier_table.center
    };
  }
  const bands = {
    low: { outer: 1.1, mid: 1.5, center: 2 },
    normal: { outer: 1.5, mid: 2.7, center: 5 },
    high: { outer: 0.1, mid: 1, center: 10 }
  };
  return bands[state.riskLevel] || bands.normal;
}

function getCellMultiplier(col, row) {
  const config = getMathConfiguration();
  if (!config) return 0;
  if (isMultiPlusVisualActive()
    && config.multi_plus?.sectors?.some((sector) => sector.col === col && sector.row === row)) {
    return config.multiplier_table.multi_plus;
  }
  for (const category of ["center", "middle", "outer"]) {
    const sector = config.sector_definitions[category]
      .find((candidate) => candidate.col === col && candidate.row === row);
    if (sector) return sector.multiplier ?? config.multiplier_table[category];
  }
  return 0;
}

function getFieldMultiplierText(multiplier, category = null) {
  const rounded = Math.round((multiplier + Number.EPSILON) * 100) / 100;
  const digits = category === "center" ? 0
    : category === "middle" || category === "multi_plus" ? 1
      : category === "outer" ? 2
        : Number.isInteger(rounded) ? 0 : Number.isInteger(rounded * 10) ? 1 : 2;
  return `${formatMultiplierValue(rounded, digits)}x`;
}

function getMultiplierText(multiplier) {
  const numericValue = Number(multiplier);
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00"}x`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMultiplierProgress(multiplier) {
  return clamp((multiplier - 0.1) / (7.5 - 0.1), 0, 1);
}

function interpolateMultiplierColor(multiplier) {
  const stops = [
    { value: 0.1, hue: 132, saturation: 92, lightness: 55 },
    { value: 2.1, hue: 56, saturation: 100, lightness: 53 },
    { value: 4.2, hue: 28, saturation: 100, lightness: 54 },
    { value: 7.5, hue: 4, saturation: 100, lightness: 56 }
  ];
  const value = clamp(multiplier, stops[0].value, stops.at(-1).value);
  const upperIndex = stops.findIndex((stop) => value <= stop.value);
  const upper = stops[Math.max(upperIndex, 1)];
  const lower = stops[Math.max(upperIndex - 1, 0)];
  const segmentProgress = upper.value === lower.value
    ? 0
    : (value - lower.value) / (upper.value - lower.value);
  const mix = (start, end) => start + (end - start) * segmentProgress;
  return {
    hue: mix(lower.hue, upper.hue),
    saturation: mix(lower.saturation, upper.saturation),
    lightness: mix(lower.lightness, upper.lightness)
  };
}

function withColorAlpha(color, alpha) {
  return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
}

function getMultiplierColor(multiplier) {
  const color = interpolateMultiplierColor(multiplier);
  return `hsla(${color.hue.toFixed(1)}, ${color.saturation.toFixed(1)}%, ${color.lightness.toFixed(1)}%, 1)`;
}

function getBonusMultiplierColor(multiplier) {
  const progress = getMultiplierProgress(multiplier);
  const hue = 276 + progress * 12;
  const saturation = 82 + progress * 18;
  const lightness = 70 + progress * 16;
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%, 1)`;
}

function getBonusResultColor(multiplier) {
  const progress = getMultiplierProgress(multiplier);
  const hue = 280 + progress * 8;
  const saturation = 92 + progress * 8;
  const lightness = 58 + progress * 8;
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%, 1)`;
}

function drawStarPath(x, y, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? outer : inner;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    });
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const roundness = (index % 2 === 0 ? outer : inner) * 0.16;
    const start = {
      x: point.x + (previous.x - point.x) * (roundness / Math.hypot(previous.x - point.x, previous.y - point.y)),
      y: point.y + (previous.y - point.y) * (roundness / Math.hypot(previous.x - point.x, previous.y - point.y))
    };
    const end = {
      x: point.x + (next.x - point.x) * (roundness / Math.hypot(next.x - point.x, next.y - point.y)),
      y: point.y + (next.y - point.y) * (roundness / Math.hypot(next.x - point.x, next.y - point.y))
    };
    if (index === 0) {
      ctx.moveTo(start.x, start.y);
    } else {
      ctx.lineTo(start.x, start.y);
    }
    ctx.quadraticCurveTo(point.x, point.y, end.x, end.y);
  });
  ctx.closePath();
}

function drawDiamondPath(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x - size * 0.48, y - size * 0.74);
  ctx.lineTo(x + size * 0.48, y - size * 0.74);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.lineTo(x, y + size * 0.86);
  ctx.closePath();
}

function drawDiamondFacets(x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.moveTo(x - size * 0.48, y - size * 0.74);
  ctx.lineTo(x, y - size * 0.28);
  ctx.lineTo(x + size * 0.48, y - size * 0.74);
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x, y + size * 0.86);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.8, size * 0.09);
  ctx.lineJoin = "round";
  ctx.stroke();
}

function getCollectibleIdleBubble(seed = 0) {
  if (!state.animationsEnabled) {
    return { scale: 1, glowScale: 1, glowAlpha: 1 };
  }
  const now = performance.now();
  const mainWave = Math.sin(now / 260 + seed);
  const beatWave = Math.sin(now / 132 + seed * 0.45 + 0.7);
  const softWave = Math.sin(now / 540 + seed * 0.73 + 1.4);
  const pop = Math.pow(0.5 + mainWave * 0.5, 1.35);
  const beat = 0.5 + beatWave * 0.5;
  return {
    scale: 0.91 + pop * 0.21 + beat * 0.025 + softWave * 0.015,
    glowScale: 1.02 + pop * 0.48 + beat * 0.08,
    glowAlpha: 0.9 + pop * 0.3 + (0.5 + softWave * 0.5) * 0.22
  };
}

function drawPuck(puck, index) {
  const puckRadius = state.field.puckRadius * (1 - (puck.pocketDepth || 0) * 0.18);
  const point = toScreen(puck.x, puck.y);

  ctx.beginPath();
  ctx.arc(point.x, point.y, puckRadius, 0, Math.PI * 2);
  const ballGradient = ctx.createRadialGradient(
    point.x - puckRadius * 0.34,
    point.y - puckRadius * 0.38,
    puckRadius * 0.08,
    point.x + puckRadius * 0.12,
    point.y + puckRadius * 0.18,
    puckRadius * 1.08
  );
  ballGradient.addColorStop(0, "#ffffff");
  ballGradient.addColorStop(0.28, "#fafaf6");
  ballGradient.addColorStop(0.62, "#e7eae4");
  ballGradient.addColorStop(0.8, "#c7cdc6");
  ballGradient.addColorStop(1, "#9ca49e");
  ctx.fillStyle = ballGradient;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, puckRadius * 0.98, 0, Math.PI * 2);
  ctx.clip();
  const innerShadow = ctx.createRadialGradient(
    point.x - puckRadius * 0.36,
    point.y - puckRadius * 0.4,
    puckRadius * 0.28,
    point.x - puckRadius * 0.08,
    point.y - puckRadius * 0.12,
    puckRadius * 1.28
  );
  innerShadow.addColorStop(0, "rgba(18, 24, 22, 0)");
  innerShadow.addColorStop(0.42, "rgba(18, 24, 22, 0)");
  innerShadow.addColorStop(0.68, "rgba(18, 24, 22, 0.16)");
  innerShadow.addColorStop(0.84, "rgba(14, 20, 18, 0.32)");
  innerShadow.addColorStop(1, "rgba(8, 12, 11, 0.58)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(point.x - puckRadius, point.y - puckRadius, puckRadius * 2, puckRadius * 2);
  ctx.restore();

  ctx.lineWidth = Math.max(2.2, puckRadius * 0.16);
  ctx.strokeStyle = "rgba(16, 18, 22, 0.88)";
  ctx.shadowColor = "rgba(0, 0, 0, 0)";
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(point.x - puckRadius * 0.3, point.y - puckRadius * 0.32, puckRadius * 0.28, 0, Math.PI * 2);
  const highlight = ctx.createRadialGradient(
    point.x - puckRadius * 0.38,
    point.y - puckRadius * 0.4,
    0,
    point.x - puckRadius * 0.3,
    point.y - puckRadius * 0.32,
    puckRadius * 0.3
  );
  highlight.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = highlight;
  ctx.fill();

  if (puck.bonus) {
    drawDiamondPath(point.x, point.y + puckRadius * 0.04, puckRadius * 0.88);
    ctx.fillStyle = "rgba(202, 104, 255, 0.98)";
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(74, 20, 112, 0.88)";
    ctx.stroke();
    drawDiamondFacets(point.x, point.y + puckRadius * 0.04, puckRadius * 0.88, "rgba(237, 196, 255, 0.68)");
  }
}

function drawPucks() {
  state.pucks.forEach((puck, index) => drawPuck(puck, index));
}

function getLaunchPrimePuck() {
  const { half } = state.field;
  return {
    // Visual-only launch placeholder: center it exactly on the bottom diamond tip.
    // Real pucks still launch from the standard internal start point in createPuck().
    x: half,
    y: half,
    pocketDepth: 0,
    bonus: false
  };
}

function drawLaunchPrimePreview() {
  if (!state.launchButtonPrimed || state.running) {
    return;
  }
  const launchPuckPreview = getLaunchPrimePuck();
  const point = toScreen(launchPuckPreview.x, launchPuckPreview.y);
  const pulse = 0.5 + Math.sin(performance.now() / 145) * 0.5;
  drawWhiteReadyWaves(point, state.field.puckRadius, pulse);
  drawPuck(launchPuckPreview, 0);
}

function drawBonusStar() {
  if (!state.bonusStars.length) {
    return;
  }

  ctx.save();
  state.bonusStars.forEach((star, index) => {
    if (star.collected) {
      return;
    }

    const point = toScreen(star.x, star.y);
    const outer = star.radius;
    const bubble = getCollectibleIdleBubble((star.index ?? index) * 0.63 + index * 0.37);
    const visualOuter = outer * bubble.scale;
    const glowOuter = outer * bubble.glowScale;
    const starStrokeWidth = Math.max(3, outer * 0.28);

    ctx.save();
    const glow = ctx.createRadialGradient(point.x, point.y, glowOuter * 0.1, point.x, point.y, glowOuter * 2.15);
    glow.addColorStop(0, `rgba(232, 194, 255, ${0.34 * bubble.glowAlpha})`);
    glow.addColorStop(0.48, `rgba(202, 104, 255, ${0.16 * bubble.glowAlpha})`);
    glow.addColorStop(1, "rgba(202, 104, 255, 0)");
    ctx.beginPath();
    ctx.arc(point.x, point.y, glowOuter * 2.15, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    drawDiamondPath(point.x, point.y, visualOuter);
    ctx.lineWidth = starStrokeWidth + 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.shadowColor = "rgba(218, 142, 255, 0.72)";
    ctx.shadowBlur = glowOuter * 1.05;
    drawDiamondPath(point.x, point.y, visualOuter);
    ctx.fillStyle = "rgba(214, 171, 255, 0.96)";
    ctx.fill();
    ctx.lineWidth = starStrokeWidth;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(213, 122, 255, 0.98)";
    ctx.lineJoin = "round";
    ctx.stroke();
    drawDiamondFacets(point.x, point.y, visualOuter, "rgba(244, 213, 255, 0.72)");
    ctx.restore();
  });
  ctx.restore();
}

function drawMultiPlusToken() {
  const token = state.multiPlusToken;
  if (!token || token.collected) return;
  const point = toScreen(token.x, token.y);
  const radius = token.radius;
  const bubble = getCollectibleIdleBubble((token.col ?? 0) * 0.79 + (token.row ?? 0) * 1.13 + 2.4);
  const visualRadius = radius * bubble.scale;
  const glowRadius = radius * bubble.glowScale;
  const inner = visualRadius * 0.46;
  const starStrokeWidth = Math.max(3, radius * 0.28);

  ctx.save();
  const glow = ctx.createRadialGradient(point.x, point.y, glowRadius * 0.1, point.x, point.y, glowRadius * 2.15);
  glow.addColorStop(0, `rgba(255, 224, 70, ${0.34 * bubble.glowAlpha})`);
  glow.addColorStop(0.48, `rgba(255, 198, 20, ${0.16 * bubble.glowAlpha})`);
  glow.addColorStop(1, "rgba(255, 198, 20, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, glowRadius * 2.15, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawStarPath(point.x, point.y, visualRadius, inner);
  ctx.lineWidth = starStrokeWidth + 2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.shadowColor = "rgba(255, 215, 45, 0.72)";
  ctx.shadowBlur = glowRadius * 1.05;
  drawStarPath(point.x, point.y, visualRadius, inner);
  ctx.fillStyle = "rgba(255, 235, 128, 0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = starStrokeWidth;
  ctx.strokeStyle = "rgba(255, 198, 20, 0.98)";
  ctx.stroke();
  ctx.restore();
}

function drawStarBursts() {
  const now = performance.now();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  state.starBursts.forEach((burst) => {
    const yellow = burst.theme === "yellow";
    const progress = Math.min(1, (now - burst.startedAt) / burst.duration);
    const alpha = Math.pow(1 - progress, 1.8);
    const flashRadius = 8 + progress * 24;
    const flash = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, flashRadius);
    flash.addColorStop(0, yellow ? `rgba(255, 244, 155, ${alpha * 0.92})` : `rgba(235, 196, 255, ${alpha * 0.9})`);
    flash.addColorStop(0.35, yellow ? `rgba(255, 211, 61, ${alpha * 0.58})` : `rgba(202, 104, 255, ${alpha * 0.55})`);
    flash.addColorStop(1, yellow ? "rgba(255, 190, 20, 0)" : "rgba(202, 104, 255, 0)");
    if (yellow) {
      drawStarPath(burst.x, burst.y, flashRadius, flashRadius * 0.42);
    } else {
      drawDiamondPath(burst.x, burst.y, flashRadius);
    }
    ctx.fillStyle = flash;
    ctx.fill();

    burst.particles.forEach((particle) => {
      const distance = particle.speed * progress;
      const x = burst.x + Math.cos(particle.angle) * distance;
      const y = burst.y + Math.sin(particle.angle) * distance;
      const size = particle.size * (1 - progress * 0.55);
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fillStyle = yellow ? `rgba(255, 218, 61, ${alpha})` : `rgba(213, 122, 255, ${alpha})`;
      ctx.fill();
    });
  });
  ctx.restore();
}

function animateStarBursts() {
  state.starEffectFrame = null;
  if (!state.animationsEnabled) return;
  const now = performance.now();
  state.starBursts = state.starBursts.filter((burst) => now - burst.startedAt < burst.duration);
  if (!state.running) {
    render();
  }
  if (state.starBursts.length > 0) {
    state.starEffectFrame = requestAnimationFrame(animateStarBursts);
  }
}

// Counter fly-in animation experiment. Remove this block to roll back the visual
// pickup-to-counter motion without touching bonus math.
function getPendingCounterFlyInCount(kind) {
  const now = performance.now();
  return state.counterFlyIns.filter((flyIn) => flyIn.kind === kind && now - flyIn.startedAt < flyIn.duration).length;
}

function getCanvasRelativeCenter(element) {
  if (!element || !els.canvas) {
    return null;
  }
  const elementRect = element.getBoundingClientRect();
  const canvasRect = els.canvas.getBoundingClientRect();
  if (!elementRect.width || !elementRect.height || !canvasRect.width || !canvasRect.height) {
    return null;
  }
  return {
    x: elementRect.left + elementRect.width / 2 - canvasRect.left,
    y: elementRect.top + elementRect.height / 2 - canvasRect.top
  };
}

function getCrownCounterTargetPoint(index) {
  const slots = Array.from(els.crownCounter?.children || []);
  if (!slots.length) {
    return null;
  }
  const requiredStars = getRequiredStars();
  const targetIndex = clamp(index, 0, Math.max(0, requiredStars - 1));
  return getCanvasRelativeCenter(slots[targetIndex]);
}

function getMultiPlusCounterTargetPoint() {
  return getCanvasRelativeCenter(els.multiPlusCounter?.querySelector(".multi-plus-icon"));
}

function startCounterFlyInAnimation() {
  if (state.counterFlyInFrame === null) {
    state.counterFlyInFrame = requestAnimationFrame(animateCounterFlyIns);
  }
}

function createCounterFlyInElement(kind) {
  if (!els.counterFlyInLayer) {
    return null;
  }
  const element = document.createElement("span");
  element.className = `counter-flyin-symbol ${kind === "diamond" ? "is-diamond" : "is-star"}`;
  element.style.width = "1px";
  element.style.height = "1px";
  element.style.opacity = "0";
  element.style.transform = "translate3d(-1000px, -1000px, 0)";
  element.innerHTML = kind === "diamond"
    ? '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="boost-diamond-outer" d="M9 35L28 9H72L91 35L50 91Z"/><path class="boost-diamond-body" d="M11 35L29 12H71L89 35L50 87Z"/><path class="boost-diamond-facets" d="M11 35H89M29 12L50 35L71 12M11 35L50 87L89 35"/></svg>'
    : '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="multi-plus-star-body" d="M47.6 17.58Q50 12 52.4 17.58L59.17 33.29Q60.27 35.86 63.06 36.12L80.09 37.7Q86.14 38.26 81.57 42.27L68.73 53.56Q66.62 55.4 67.24 58.13L71 74.81Q72.34 80.74 67.11 77.64L52.4 68.91Q50 67.48 47.6 68.91L32.89 77.64Q27.66 80.74 29 74.81L32.76 58.13Q33.38 55.4 31.27 53.56L18.43 42.27Q13.86 38.26 19.91 37.7L36.94 36.12Q39.73 35.86 40.83 33.29Z"/></svg>';
  els.counterFlyInLayer.append(element);
  return element;
}

function removeCounterFlyInElement(flyIn) {
  flyIn?.element?.remove();
  if (flyIn) flyIn.element = null;
}

function clearCounterFlyIns(kind = null) {
  state.counterFlyIns = state.counterFlyIns.filter((flyIn) => {
    if (kind && flyIn.kind !== kind) {
      return true;
    }
    removeCounterFlyInElement(flyIn);
    return false;
  });
}

function spawnCounterFlyIn(kind, source, target, sourceSize, onComplete = null) {
  if (!state.animationsEnabled || !source || !target) {
    return null;
  }
  const targetSize = kind === "diamond" ? 13 : 12;
  const flyIn = {
    kind,
    source,
    target,
    sourceSize,
    targetSize,
    startedAt: performance.now(),
    duration: COUNTER_FLY_IN_DURATION_MS,
    element: createCounterFlyInElement(kind),
    onComplete
  };
  syncCounterFlyInElement(flyIn, flyIn.startedAt);
  state.counterFlyIns.push(flyIn);
  startCounterFlyInAnimation();
  return flyIn;
}

function syncCounterFlyInElement(flyIn, now) {
  if (!flyIn.element) return;
  const progress = clamp((now - flyIn.startedAt) / flyIn.duration, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const x = flyIn.source.x + (flyIn.target.x - flyIn.source.x) * eased;
  const y = flyIn.source.y + (flyIn.target.y - flyIn.source.y) * eased;
  const arcLift = Math.sin(progress * Math.PI) * Math.max(18, state.field.puckRadius * 1.1);
  const size = flyIn.sourceSize + (flyIn.targetSize - flyIn.sourceSize) * eased;
  const pop = 1 + Math.sin(progress * Math.PI) * 0.1;
  const alpha = progress < 0.9 ? 1 : clamp(1 - (progress - 0.9) / 0.1, 0, 1);
  const diameter = Math.max(8, size * 2 * pop);
  const rotation = flyIn.kind === "multiPlus" ? progress * 44 : 0;
  flyIn.element.style.width = `${diameter}px`;
  flyIn.element.style.height = `${diameter}px`;
  flyIn.element.style.opacity = String(alpha);
  flyIn.element.style.transform = `translate3d(${x}px, ${y - arcLift}px, 0) translate(-50%, -50%) rotate(${rotation}deg)`;
}

function drawCounterFlyInDiamond(x, y, size, alpha) {
  const strokeWidth = Math.max(2.4, size * 0.24);
  ctx.save();
  ctx.globalAlpha *= alpha;
  const glow = ctx.createRadialGradient(x, y, size * 0.18, x, y, size * 1.9);
  glow.addColorStop(0, "rgba(238, 207, 255, 0.34)");
  glow.addColorStop(0.42, "rgba(202, 104, 255, 0.18)");
  glow.addColorStop(1, "rgba(202, 104, 255, 0)");
  ctx.beginPath();
  ctx.arc(x, y, size * 1.9, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawDiamondPath(x, y, size);
  ctx.lineWidth = strokeWidth + 1.8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.shadowColor = "rgba(218, 142, 255, 0.52)";
  ctx.shadowBlur = size * 0.78;
  drawDiamondPath(x, y, size);
  ctx.fillStyle = "rgba(214, 171, 255, 0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "rgba(213, 122, 255, 0.98)";
  ctx.stroke();
  drawDiamondFacets(x, y, size, "rgba(244, 213, 255, 0.74)");
  ctx.restore();
}

function drawCounterFlyInStar(x, y, size, alpha, rotation) {
  const inner = size * 0.46;
  const strokeWidth = Math.max(2.4, size * 0.24);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const glow = ctx.createRadialGradient(0, 0, size * 0.12, 0, 0, size * 2.05);
  glow.addColorStop(0, "rgba(255, 244, 155, 0.42)");
  glow.addColorStop(0.46, "rgba(255, 198, 20, 0.18)");
  glow.addColorStop(1, "rgba(255, 198, 20, 0)");
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.05, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawStarPath(0, 0, size, inner);
  ctx.lineWidth = strokeWidth + 1.8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.shadowColor = "rgba(255, 215, 45, 0.76)";
  ctx.shadowBlur = size * 1.05;
  drawStarPath(0, 0, size, inner);
  ctx.fillStyle = "rgba(255, 235, 128, 0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "rgba(255, 198, 20, 0.98)";
  ctx.stroke();
  ctx.restore();
}

function drawCounterFlyIns() {
  if (!state.counterFlyIns.length || !state.animationsEnabled) {
    return;
  }
  const now = performance.now();
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  state.counterFlyIns.forEach((flyIn) => {
    const progress = clamp((now - flyIn.startedAt) / flyIn.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const x = flyIn.source.x + (flyIn.target.x - flyIn.source.x) * eased;
    const y = flyIn.source.y + (flyIn.target.y - flyIn.source.y) * eased;
    const arcLift = Math.sin(progress * Math.PI) * Math.max(18, state.field.puckRadius * 1.1);
    const size = flyIn.sourceSize + (flyIn.targetSize - flyIn.sourceSize) * eased;
    const pop = 1 + Math.sin(progress * Math.PI) * 0.1;
    const alpha = progress < 0.9 ? 1 : clamp(1 - (progress - 0.9) / 0.1, 0, 1);
    if (flyIn.kind === "diamond") {
      drawCounterFlyInDiamond(x, y - arcLift, size * pop, alpha);
    } else {
      drawCounterFlyInStar(x, y - arcLift, size * pop, alpha, progress * Math.PI * 1.2);
    }
  });
  ctx.restore();
}

function animateCounterFlyIns() {
  state.counterFlyInFrame = null;
  if (!state.animationsEnabled) return;
  const now = performance.now();
  const callbacks = [];
  let completedFlyIn = false;
  state.counterFlyIns.forEach((flyIn) => syncCounterFlyInElement(flyIn, now));
  state.counterFlyIns = state.counterFlyIns.filter((flyIn) => {
    const active = now - flyIn.startedAt < flyIn.duration;
    if (!active) {
      completedFlyIn = true;
      removeCounterFlyInElement(flyIn);
      if (typeof flyIn.onComplete === "function") {
        callbacks.push(flyIn.onComplete);
      }
    }
    return active;
  });
  if (completedFlyIn) {
    updateCrownCounter();
    updateMultiPlusCounter();
  }
  if (callbacks.length) {
    callbacks.forEach((callback) => callback());
  }
  if (!state.running) {
    render();
  }
  if (state.counterFlyIns.length > 0) {
    state.counterFlyInFrame = requestAnimationFrame(animateCounterFlyIns);
  }
}

function hasVisibleCollectibles() {
  return state.bonusStars.some((star) => !star.collected)
    || Boolean(state.multiPlusToken && !state.multiPlusToken.collected)
    || (usesFieldPocketMechanics() && Boolean(state.fieldPocket));
}

function animateCollectibleIdle(timestamp = performance.now()) {
  state.collectibleIdleFrame = null;
  if (!state.animationsEnabled || state.running || !hasVisibleCollectibles()) {
    return;
  }
  if (timestamp - state.lastCollectibleIdleRenderAt >= COLLECTIBLE_IDLE_FRAME_INTERVAL_MS) {
    state.lastCollectibleIdleRenderAt = timestamp;
    render();
  }
  if (!state.running && hasVisibleCollectibles()) {
    state.collectibleIdleFrame = requestAnimationFrame(animateCollectibleIdle);
  }
}

function startCollectibleIdleAnimation() {
  if (!state.animationsEnabled || state.running || !hasVisibleCollectibles()) {
    return;
  }
  if (state.collectibleIdleFrame === null) {
    state.collectibleIdleFrame = requestAnimationFrame(animateCollectibleIdle);
  }
}

function animateResultReveal() {
  state.resultRevealFrame = null;
  const now = performance.now();
  const fieldRevealActive = state.multiPlusActive
    && state.multiPlusActivatedAt > 0
    && now - state.multiPlusActivatedAt < RESULT_BOOST_REVEAL_DURATION_MS;
  const revealActive = fieldRevealActive || state.pucks.some((puck) => puck.result?.multiplier > 0
    && (now - (puck.resultRevealStartedAt || 0) < RESULT_BOOST_REVEAL_DURATION_MS
      || now - (puck.result.boostRevealStartedAt || 0) < RESULT_BOOST_REVEAL_DURATION_MS));
  if (!state.running) render();
  if (revealActive) {
    state.resultRevealFrame = requestAnimationFrame(animateResultReveal);
  }
}

function startResultRevealAnimation() {
  if (!state.animationsEnabled) {
    render();
    return;
  }
  if (state.resultRevealFrame === null) {
    state.resultRevealFrame = requestAnimationFrame(animateResultReveal);
  }
}

function getMultiplierRevealMotion(startedAt, endY) {
  if (!state.animationsEnabled || !startedAt) return { y: endY, alpha: 1 };
  const elapsed = performance.now() - startedAt;
  const progress = clamp(elapsed / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  return { y: endY + (1 - eased) * 26, alpha: progress };
}

function spawnStarBurst(star, theme = "purple") {
  if (!state.animationsEnabled) return;
  const point = toScreen(star.x, star.y);
  state.starBursts.push({
    x: point.x,
    y: point.y,
    startedAt: performance.now(),
    duration: 430,
    theme,
    particles: Array.from({ length: 10 }, (_, index) => ({
      angle: (index / 10) * Math.PI * 2 + randomBetween(-0.18, 0.18),
      speed: randomBetween(18, 34),
      size: randomBetween(1.4, 2.8)
    }))
  });
  if (state.starEffectFrame === null) {
    state.starEffectFrame = requestAnimationFrame(animateStarBursts);
  }
}

function drawResultOverlay({ glows = true, text = true } = {}) {
  const bonusVisualActive = isX10VisualActive();
  if (state.roundOutcome?.bonus_triggered && !bonusVisualActive) return;

  const getWinningTextMetrics = (text, font) => {
    ctx.save();
    ctx.font = font;
    const measured = ctx.measureText(text);
    const fontSize = Number.parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || "30");
    const textWidth = (measured.actualBoundingBoxLeft || 0) + (measured.actualBoundingBoxRight || 0)
      || measured.width;
    const textHeight = (measured.actualBoundingBoxAscent || 0) + (measured.actualBoundingBoxDescent || 0)
      || fontSize * 0.82;
    const width = textWidth + 28;
    const height = fontSize * 1.35;
    ctx.restore();
    return {
      width,
      height,
      collisionWidth: textWidth,
      collisionHeight: Math.max(fontSize * 0.72, textHeight * 0.92)
    };
  };

  const drawWinningGlow = (text, x, y, color, font, bonusGlow = false) => {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const { width, height } = getWinningTextMetrics(text, font);
    const glowRadius = Math.max(width * 0.78, height * 1.35);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, bonusGlow ? "rgba(214, 171, 255, 0.58)" : withColorAlpha(color, 0.34));
    glow.addColorStop(0.48, bonusGlow ? "rgba(142, 63, 190, 0.22)" : withColorAlpha(color, 0.12));
    glow.addColorStop(1, bonusGlow ? "rgba(112, 42, 153, 0)" : withColorAlpha(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
    ctx.restore();
  };

  const drawWinningText = (text, x, y, color, font, outlineColor = "rgba(0, 0, 0, 0.92)", outlineWidth = 6, outerOutlineColor = null) => {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    if (outerOutlineColor) {
      ctx.lineWidth = outlineWidth + 6;
      ctx.strokeStyle = outerOutlineColor;
      ctx.strokeText(text, x, y);
    }
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outlineColor;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = outerOutlineColor ? withColorAlpha(color, 0.82) : "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = outerOutlineColor ? 14 : 0;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const resultPucks = state.pucks.filter((puck) => puck.result?.multiplier > 0);
  const getRevealMotion = (puck, point) => {
    return getMultiplierRevealMotion(puck.resultRevealStartedAt, point.y - 34);
  };
  const getBoostRevealMotion = (puck, point) => {
    if (!state.animationsEnabled || !puck.result?.boostRevealStartedAt) return null;
    const elapsed = performance.now() - puck.result.boostRevealStartedAt;
    const progress = clamp(elapsed / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    return {
      progress,
      oldY: point.y - 34 + eased * 26,
      newY: point.y - 8 - eased * 26
    };
  };
  const resultItems = resultPucks
    .map((puck) => {
      const point = toScreen(puck.x, puck.y);
      const reveal = getRevealMotion(puck, point);
      const boostReveal = getBoostRevealMotion(puck, point);
      const canUseBonusMultiplier = (bonusVisualActive || puck.result.x10Boosted) && !puck.result.secretRoom;
      const resultMultiplier = puck.result.multiplier * (canUseBonusMultiplier ? 10 : 1);
      const classification = classifyResult(resultMultiplier, puck.result.category);
      const resultText = getMultiplierText(resultMultiplier);
      const resultColor = puck.result.purpleBoost
        ? getBonusResultColor(Math.max(1, puck.result.multiplier / PURPLE_POCKET_MULTIPLIER))
        : canUseBonusMultiplier
        ? getBonusResultColor(puck.result.multiplier)
        : puck.result.secretRoom
          ? getBonusResultColor(getSecretRoomBaseMultiplier())
          : getMultiplierColor(puck.result.multiplier);
      const baseFontSize = classification.celebrate ? 30 : 23;
      const fontSize = (canUseBonusMultiplier || puck.result.secretRoom || puck.result.purpleBoost) ? baseFontSize * 1.2 : baseFontSize;
      const font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      const metrics = getWinningTextMetrics(resultText, font);
      return {
        puck,
        x: point.x,
        y: boostReveal?.newY ?? reveal.y,
        baseY: boostReveal?.newY ?? reveal.y,
        alpha: boostReveal?.progress ?? reveal.alpha,
        resultText,
        resultColor,
        font,
        boostReveal: boostReveal ? {
          oldText: getMultiplierText(puck.result.multiplier),
          oldColor: getMultiplierColor(puck.result.multiplier),
          oldFont: `1000 ${classification.celebrate ? 30 : 23}px Inter, system-ui, sans-serif`,
          oldY: boostReveal.oldY,
          alpha: 1 - boostReveal.progress
        } : null,
        width: metrics.width,
        height: metrics.height,
        collisionWidth: metrics.collisionWidth,
        collisionHeight: metrics.collisionHeight,
        appearedAt: puck.resultRevealStartedAt || 0
      };
    })
    .sort((a, b) => a.appearedAt - b.appearedAt);

  const placedBounds = [];
  const stackGap = 1;
  resultItems.forEach((item) => {
    let attempts = 0;
    while (attempts < 8) {
      const bounds = {
        left: item.x - item.collisionWidth / 2,
        right: item.x + item.collisionWidth / 2,
        top: item.y - item.collisionHeight / 2,
        bottom: item.y + item.collisionHeight / 2
      };
      const collision = placedBounds.find((placed) =>
        bounds.left < placed.right
        && bounds.right > placed.left
        && bounds.top < placed.bottom + stackGap
        && bounds.bottom > placed.top - stackGap);
      if (!collision) {
        placedBounds.push(bounds);
        break;
      }
      item.y = collision.top - item.collisionHeight / 2 - stackGap;
      attempts += 1;
    }
    if (item.boostReveal) item.boostReveal.oldY += item.y - item.baseY;
  });

  if (glows) {
    resultItems.forEach((item) => {
      if (item.boostReveal) {
        ctx.save();
        ctx.globalAlpha = item.boostReveal.alpha;
        drawWinningGlow(item.boostReveal.oldText, item.x, item.boostReveal.oldY,
          item.boostReveal.oldColor, item.boostReveal.oldFont, false);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = item.alpha;
      drawWinningGlow(item.resultText, item.x, item.y, item.resultColor, item.font, bonusVisualActive);
      ctx.restore();
    });
  }
  if (text) {
    resultItems.forEach((item) => {
      if (item.boostReveal) {
        ctx.save();
        ctx.globalAlpha = item.boostReveal.alpha;
        drawWinningText(item.boostReveal.oldText, item.x, item.boostReveal.oldY,
          item.boostReveal.oldColor, item.boostReveal.oldFont,
          "rgba(0, 0, 0, 0.92)", 6, null);
        ctx.restore();
      }
      const outlineColor = bonusVisualActive ? "rgba(238, 202, 255, 0.98)" : "rgba(0, 0, 0, 0.92)";
      const outlineWidth = bonusVisualActive ? 2.5 : 6;
      const outerOutlineColor = bonusVisualActive ? "rgba(0, 0, 0, 0.94)" : null;
      ctx.save();
      ctx.globalAlpha = item.alpha;
      drawWinningText(item.resultText, item.x, item.y, item.resultColor, item.font,
        outlineColor, outlineWidth, outerOutlineColor);
      ctx.restore();
    });
  }
}

function classifyResult(multiplier, category = "") {
  if (multiplier <= 0) return { key: "miss", label: "MISS", color: "rgba(170, 176, 184, 0.98)", celebrate: false };
  if (multiplier < 1) return { key: "partial", label: "DEFLECT", color: "rgba(255, 94, 48, 0.98)", celebrate: false };
  if (Math.abs(multiplier - 1) < 1e-9) return { key: "push", label: "PUSH", color: "rgba(255, 174, 48, 0.98)", celebrate: false };
  const bigWin = category === "secret" || (state.riskLevel === "high" && category === "center");
  return { key: bigWin ? "big_win" : "win", label: bigWin ? "BIG WIN" : "WIN", color: null, celebrate: true };
}

function render() {
  updatePocketBonusCounter();
  drawField();
  const { half, grid } = state.field;
  const bonusGridActive = state.crownsCollected >= getRequiredStars();
  drawMainFieldMultiplierLabels(buildMergedMultiplierCells(), bonusGridActive, half, grid);
  // Collectible symbols stay above field labels; moving pucks are drawn above every field layer.
  drawMultiPlusToken();
  drawBonusStar();
  drawStarBursts();
  drawLaunchPrimePreview();
  drawResultOverlay({ text: false });
  drawPucks();
  // Field labels are below pucks, while their earlier pass remains above pocket rims.
  drawResultOverlay({ glows: false });
  drawPhysicsDebugOverlay();
  updatePhysicsDebug();
}

function updatePhysicsDebug() {
  if (!els.physicsDebug) return;
  els.physicsDebug.classList.toggle("hidden", !state.debugPhysics);
  if (!state.debugPhysics) return;
  const config = getMathConfiguration();
  const visualCollected = state.crownsCollected;
  const lines = [
    `config_id: ${config?.id || "-"}`,
    `risk: ${state.riskLevel}`,
    `lines: ${GRID_SIZE}`,
    `pucks: ${state.puckCount}`,
    `running: ${state.running}`,
    `active puck objects: ${state.pucks.length}`,
    `trajectory plans: ${state.trajectoryPlans.length}`,
    `puck phases: ${state.pucks.map((puck) => puck.secretRoom?.phase || (puck.stopped ? "stopped" : "field")).join(", ") || "none"}`,
    `bonus expected: ${Boolean(state.roundOutcome?.bonus_triggered)}`,
    `bonus visually collected: ${visualCollected}/${getRequiredStars()}`
  ];
  state.trajectoryDiagnostics.forEach((item) => {
    lines.push(
      "",
      `puck ${item.puck_index + 1}`,
      ` trajectory_id: ${item.trajectory_id}`,
      ` target sector: ${item.target_sector.col}_${item.target_sector.row}`,
      ` actual sector: ${item.actual_sector ? `${item.actual_sector.col}_${item.actual_sector.row}` : "moving"}`,
      ` target category: ${item.target_category}`,
      ` final category: ${item.actual_category || "moving"}`,
      ` target multiplier: ${item.target_multiplier}x`,
      ` launch angle: ${item.launch_angle} deg`,
      ` launch force: ${item.launch_force}`,
      ` friction variant: ${item.friction_variant}`,
      ` duration: ${item.duration}s`,
      ` bounces: ${item.bounce_count}`,
      ` valid: ${item.valid}`,
      ` correction: ${item.final_correction_px}px`,
      ` final in cell: ${item.final_position_percent || "pending"}`,
      ` center distance: ${item.final_distance_to_center_px ?? "pending"}px`,
      ` recent usage: ${item.recent_usage_count}`
    );
  });
  (state.roundOutcome?.star_positions || []).forEach((star, index) => {
    const pickup = state.starPickupLog.find((item) => item.star_index === index);
    lines.push(
      "",
      `star ${index + 1}`,
      ` cell: ${star.col}_${star.row}`,
      ` expected collected: ${star.collected}`,
      ` actual collected: ${Boolean(pickup)}`,
      ` assigned path: ${star.assigned_result_path || "main"}`,
      ` collector path: ${pickup?.collector_result_path || "-"}`,
      ` pickup phase: ${star.pickup_phase}`,
      ` pickup time: ${pickup?.time ?? star.collect_time ?? "-"}`,
      ` pickup bounces: ${pickup?.bounce_count ?? star.pickup_bounce_count ?? "-"}`
    );
  });
  const multiPlusPosition = state.roundOutcome?.multi_plus_position;
  if (multiPlusPosition) {
    lines.push(
      "",
      "EX MULTI star",
      ` expected collected: ${multiPlusPosition.collected}`,
      ` actual collected: ${state.multiPlusActive}`,
      ` assigned path: ${multiPlusPosition.assigned_result_path || "main"}`,
      ` collector path: ${state.multiPlusPickupLog?.collector_result_path || "-"}`
    );
  }
  els.physicsDebug.textContent = lines.join("\n");
}

function drawPhysicsDebugOverlay() {
  if (!state.debugPhysics) return;
  ctx.save();
  state.trajectoryPlans.forEach((plan, index) => {
    if (!plan?.frames?.length) return;
    ctx.beginPath();
    plan.frames.forEach((frame, frameIndex) => {
      const point = toScreen(frame[1] * state.field.half, frame[2] * state.field.half);
      if (frameIndex === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = index === 0 ? "rgba(117,217,255,.7)" : index === 1 ? "rgba(255,174,48,.7)" : "rgba(213,122,255,.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    plan.bounce_points?.forEach((bounce) => {
      const point = toScreen(bounce[1] * state.field.half, bounce[2] * state.field.half);
      ctx.fillStyle = "#fff";
      ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    });
    const target = plan.target_sector;
    drawCell(target.col, target.row, "rgba(0,0,0,0)", "rgba(255,255,255,.9)");
    const finalPoint = toScreen(plan.landing_point.x * state.field.half, plan.landing_point.y * state.field.half);
    ctx.beginPath();
    ctx.arc(finalPoint.x, finalPoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffeb63";
    ctx.fill();
    const { half, grid, puckRadius } = state.field;
    const margin = puckRadius + 2;
    const x0 = -half + target.col * grid + margin;
    const y0 = -half + target.row * grid + margin;
    const x1 = -half + (target.col + 1) * grid - margin;
    const y1 = -half + (target.row + 1) * grid - margin;
    const safe = [toScreen(x0, y0), toScreen(x1, y0), toScreen(x1, y1), toScreen(x0, y1)];
    ctx.beginPath();
    safe.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,235,99,.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  (state.roundOutcome?.star_positions || []).forEach((star, index) => {
    const point = toScreen(
      Number.isFinite(star.x) ? star.x * state.field.half : -state.field.half + state.field.grid * (star.col + 0.5),
      Number.isFinite(star.y) ? star.y * state.field.half : -state.field.half + state.field.grid * (star.row + 0.5)
    );
    ctx.fillStyle = "#e0a6ff";
    ctx.font = "700 9px ui-monospace, monospace";
    ctx.fillText(`${index + 1}:${star.pickup_phase || "none"}`, point.x + 5, point.y - 5);
  });
  ctx.restore();
}

const trajectoryPocketSafetyCache = new Map();

function trajectoryClearsInactivePockets(descriptor) {
  if (!descriptor) return false;
  if (trajectoryPocketSafetyCache.has(descriptor.id)) return trajectoryPocketSafetyCache.get(descriptor.id);
  const planner = window.PuckLuckTrajectoryPlanner;
  const trajectory = planner?.hydrateTrajectory(descriptor);
  const radius = descriptor.puck_radius || getMathConfiguration()?.puck_radius || 0.1;
  const clears = Boolean(trajectory?.frames?.length)
    && planner.trajectoryClearsPockets(trajectory.frames, radius);
  trajectoryPocketSafetyCache.set(descriptor.id, clears);
  return clears;
}

function getSafeStandardTrajectoryVariants(lines, cellId) {
  const variants = window.PuckLuckTrajectoryLibrary?.library?.[lines]?.[cellId] || [];
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    const planner = window.PuckLuckTrajectoryPlanner;
    const pocket = getFieldPocketNormalized();
    const radius = getMathConfiguration()?.puck_radius || 0.1;
    return variants.filter((descriptor) => {
      const trajectory = planner?.hydrateTrajectory(descriptor);
      return Boolean(trajectory?.frames?.length)
        && planner.trajectoryClearsPockets(trajectory.frames, radius, [pocket]);
    });
  }
  return variants.filter(trajectoryClearsInactivePockets);
}

const fieldPocketCentersNormalized = Object.freeze([
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 }
]);

function getCollectibleSymbolRadiusNormalized() {
  return (getMathConfiguration()?.puck_radius || 0.1) * 0.56;
}

function collectibleSymbolClearsFieldObstaclesNormalized(x, y, radiusNorm = getCollectibleSymbolRadiusNormalized()) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    const col = clamp(Math.floor(((x + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1);
    const row = clamp(Math.floor(((y + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1);
    if (col === state.fieldPocket.col && row === state.fieldPocket.row) return false;
  }
  const pocketRadiusNorm = getMathConfiguration()?.puck_radius || 0.1;
  const wallClearance = radiusNorm + 0.028;
  if (Math.abs(x) > 1 - wallClearance || Math.abs(y) > 1 - wallClearance) return false;
  const pocketClearance = pocketRadiusNorm + radiusNorm + 0.03;
  const pockets = usesFieldPocketMechanics()
    ? [getFieldPocketNormalized()].filter(Boolean)
    : fieldPocketCentersNormalized;
  return pockets.every((pocket) =>
    Math.hypot(x - pocket.x, y - pocket.y) >= pocketClearance);
}

function collectibleSymbolClearsFieldObstaclesLocal(x, y, radiusPx) {
  const half = state.field.half || 1;
  return collectibleSymbolClearsFieldObstaclesNormalized(x / half, y / half, radiusPx / half);
}

function getSafeCollectibleEdgeCoordinate(lines) {
  const edgeCellCenter = 1 - 1 / lines;
  const radius = getCollectibleSymbolRadiusNormalized();
  if (usesFieldPocketMechanics()) return Math.min(edgeCellCenter, 1 - radius - 0.034);
  const pocketRadius = getMathConfiguration()?.puck_radius || 0.1;
  const safePocketEdge = 1 - pocketRadius - radius - 0.036;
  const safeWallEdge = 1 - radius - 0.034;
  return Math.min(edgeCellCenter, safePocketEdge, safeWallEdge);
}

const trajectoryComparisonCache = new Map();

function trajectoryChoiceHash(seed, id) {
  let value = (seed >>> 0) || 0x6d2b79f5;
  const text = String(id || "");
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  }
  return (value ^ (value >>> 16)) >>> 0;
}

function shouldUseEarlyPocketEntry(result) {
  if (usesFieldPocketMechanics()) return false;
  if (!result?.secret_room || !Number.isFinite(result.visual_seed)) return false;
  const normalizedSeed = (result.visual_seed >>> 0) / 0x100000000;
  return normalizedSeed < EARLY_POCKET_ENTRY_VISUAL_PROBABILITY;
}

function hydrateTrajectoryForComparison(descriptor) {
  if (!descriptor?.id) return null;
  if (trajectoryComparisonCache.has(descriptor.id)) return trajectoryComparisonCache.get(descriptor.id);
  const trajectory = window.PuckLuckTrajectoryPlanner?.hydrateTrajectory(descriptor) || null;
  trajectoryComparisonCache.set(descriptor.id, trajectory);
  return trajectory;
}

function prepareTrajectoryForResult(descriptor, result, staggerDelay = 0) {
  const trajectory = window.PuckLuckTrajectoryPlanner?.hydrateTrajectory(descriptor);
  if (!trajectory) return null;
  trajectory.target_category = result?.category || descriptor.target_category;
  trajectory.recent_usage_count = state.trajectoryUsage[descriptor.id] || 0;
  trajectory.stagger_delay = staggerDelay;
  if (!usesFieldPocketMechanics() && result?.secret_room && trajectory.frames?.length) {
    const captureFrameIndex = Math.max(1, Math.min(
      descriptor.capture_frame_index ?? trajectory.frames.length - 1,
      trajectory.frames.length - 1
    ));
    trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
    const captureFrame = trajectory.frames.at(-1);
    trajectory.duration = captureFrame[0];
    trajectory.bounce_count = captureFrame[5];
    trajectory.landing_point = { x: captureFrame[1], y: captureFrame[2] };
    trajectory.valid = true;
    trajectory.final_sector = { ...result.sector };
  }
  return trajectory;
}

function trajectoryVisualSignature(trajectory) {
  if (!trajectory?.frames?.length) return String(trajectory?.id || "");
  const frames = trajectory.frames;
  const checkpoints = [0.18, 0.32, 0.46, 0.60, 0.74, 0.88].map((progress) => {
    const index = Math.max(0, Math.min(frames.length - 1, Math.round((frames.length - 1) * progress)));
    return `${Math.round(frames[index][1] * 24)}_${Math.round(frames[index][2] * 24)}`;
  }).join("|");
  const bounces = (trajectory.bounce_points || []).slice(0, 6)
    .map((point) => `${Math.round(point[1] * 14)}_${Math.round(point[2] * 14)}`)
    .join("|");
  return [
    Math.round((trajectory.launch_angle_degrees || 0) * 3),
    trajectory.bounce_count || 0,
    checkpoints,
    bounces
  ].join(":");
}

function bouncePatternLooksDuplicated(first, second, puckRadius) {
  const firstBounces = first?.bounce_points || [];
  const secondBounces = second?.bounce_points || [];
  if (!firstBounces.length || firstBounces.length !== secondBounces.length) return false;
  const angleGap = Math.abs((first.launch_angle_degrees || 0) - (second.launch_angle_degrees || 0));
  if (angleGap > 1.15) return false;
  const threshold = Math.max(puckRadius * 0.95, 0.075);
  return firstBounces.every((bounce, index) => {
    const other = secondBounces[index];
    return other && Math.hypot(bounce[1] - other[1], bounce[2] - other[2]) <= threshold;
  });
}

function trajectoriesLookDuplicated(first, second, puckRadius = 0.1) {
  if (!first || !second) return false;
  if (first.id && first.id === second.id) return true;
  if (trajectoryVisualSignature(first) === trajectoryVisualSignature(second)) return true;
  if (bouncePatternLooksDuplicated(first, second, puckRadius)) return true;
  const firstFrames = first.frames || [];
  const secondFrames = second.frames || [];
  const sampleCount = 18;
  if (firstFrames.length < sampleCount || secondFrames.length < sampleCount) return false;
  const threshold = Math.max(puckRadius * 1.45, 0.105);
  let closeSamples = 0;
  let closeStreak = 0;
  let longestStreak = 0;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const progress = 0.14 + sample * (0.76 / (sampleCount - 1));
    const firstIndex = Math.max(1, Math.min(firstFrames.length - 1, Math.round((firstFrames.length - 1) * progress)));
    const secondIndex = Math.max(1, Math.min(secondFrames.length - 1, Math.round((secondFrames.length - 1) * progress)));
    const distance = Math.hypot(firstFrames[firstIndex][1] - secondFrames[secondIndex][1],
      firstFrames[firstIndex][2] - secondFrames[secondIndex][2]);
    if (distance <= threshold) {
      closeSamples += 1;
      closeStreak += 1;
      longestStreak = Math.max(longestStreak, closeStreak);
    } else {
      closeStreak = 0;
    }
  }
  return closeSamples / sampleCount >= 0.42 || longestStreak >= 6;
}

function descriptorsLookDuplicated(firstDescriptor, secondDescriptor, puckRadius) {
  if (!firstDescriptor || !secondDescriptor) return false;
  if (firstDescriptor.id === secondDescriptor.id) return true;
  return trajectoriesLookDuplicated(
    hydrateTrajectoryForComparison(firstDescriptor),
    hydrateTrajectoryForComparison(secondDescriptor),
    puckRadius || firstDescriptor.puck_radius || secondDescriptor.puck_radius || 0.1
  );
}

function trajectoryConflictsWithRound(candidate, existingPlans, puckRadius) {
  return existingPlans.some((plan) => plan?.valid
    && trajectoriesLookDuplicated(candidate, plan, puckRadius));
}

function selectDistinctTrajectoryDescriptor({
  variants,
  seed,
  result,
  existingPlans = [],
  staggerDelay = 0,
  recentHistorySize = 20,
  preferEarlyPocketEntry = false
}) {
  if (!variants?.length) return null;
  const orderedVariants = preferEarlyPocketEntry
    ? [...variants].sort((first, second) =>
      (first.capture_trajectory_progress ?? 1) - (second.capture_trajectory_progress ?? 1)
      || (first.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
        - (second.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
      || first.id.localeCompare(second.id))
    : variants;
  const existingIds = new Set(existingPlans.map((plan) => plan?.id).filter(Boolean));
  const recentIds = new Set(state.recentTrajectoryIds.slice(-recentHistorySize));
  let pool = orderedVariants.filter((descriptor) => !existingIds.has(descriptor.id)
    && !recentIds.has(descriptor.id));
  if (!pool.length) {
    pool = orderedVariants.filter((descriptor) => !existingIds.has(descriptor.id));
  }
  if (!pool.length) return null;
  const minimumUsage = Math.min(...pool.map((descriptor) => state.trajectoryUsage[descriptor.id] || 0));
  const preferred = pool.filter((descriptor) => (state.trajectoryUsage[descriptor.id] || 0) <= minimumUsage + 1);
  const ordered = [...preferred, ...pool.filter((descriptor) => !preferred.includes(descriptor))]
    .sort((first, second) =>
      (preferEarlyPocketEntry
        ? (first.capture_trajectory_progress ?? 1) - (second.capture_trajectory_progress ?? 1)
          || (first.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
            - (second.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
        : 0)
      || (state.trajectoryUsage[first.id] || 0) - (state.trajectoryUsage[second.id] || 0)
      || trajectoryChoiceHash(seed, first.id) - trajectoryChoiceHash(seed, second.id)
      || first.id.localeCompare(second.id));
  const puckRadius = getMathConfiguration()?.puck_radius || ordered[0]?.puck_radius || 0.1;
  for (const descriptor of ordered) {
    const trajectory = prepareTrajectoryForResult(descriptor, result, staggerDelay);
    if (!trajectory?.valid) continue;
    if (trajectoryConflictsWithRound(trajectory, existingPlans, puckRadius)) continue;
    return { descriptor, trajectory };
  }
  return null;
}

function visitRoundResultTree(results, visitor) {
  (results || []).forEach((result) => {
    visitor(result);
    if (result.secret_room) visitRoundResultTree(result.release_results, visitor);
  });
}

function roundSupportsFieldPocket(roundOutcome, pocket) {
  const previousPocket = state.fieldPocket;
  state.fieldPocket = pocket;
  try {
    const mainPlans = [];
    for (let puckIndex = 0; puckIndex < (roundOutcome.puck_results || []).length; puckIndex += 1) {
      const result = roundOutcome.puck_results[puckIndex];
      if (!result.secret_room) {
        if (!getSafeStandardTrajectoryVariants(GRID_SIZE, `${result.sector.col}_${result.sector.row}`).length) {
          return false;
        }
        continue;
      }
      const trajectory = planRuntimeFieldPocketTrajectory({
        result,
        seed: (result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0,
        existingPlans: mainPlans,
        releaseIndex: puckIndex
      });
      if (!trajectory) return false;
      mainPlans.push(trajectory);
    }

    let releaseIndex = 0;
    const supportsPocketResult = (pocketResult) => {
      if (!pocketResult?.secret_room) return true;
      const siblingPlans = [];
      for (const result of pocketResult.release_results || []) {
        const trajectory = planRuntimeFieldPocketTrajectory({
          result,
          seed: (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0,
          existingPlans: siblingPlans,
          startPoint: getFieldPocketNormalized(pocket),
          releaseIndex
        });
        releaseIndex += 1;
        if (!trajectory) return false;
        siblingPlans.push(trajectory);
        if (result.secret_room && !supportsPocketResult(result)) return false;
      }
      return true;
    };
    return (roundOutcome.puck_results || []).every(supportsPocketResult);
  } finally {
    state.fieldPocket = previousPocket;
  }
}

function selectRoundFieldPocket(roundOutcome) {
  if (!usesFieldPocketMechanics() || !roundOutcome) return null;
  const config = getMathConfiguration();
  if (!config) return null;
  const reserved = new Set([`${GRID_SIZE - 1}_${GRID_SIZE - 1}`]);
  visitRoundResultTree(roundOutcome.puck_results, (result) => {
    if (!result.secret_room && result.sector) {
      reserved.add(`${result.sector.col}_${result.sector.row}`);
    }
  });
  if (roundOutcome.multi_plus_triggered) {
    (config.multi_plus?.sectors || []).forEach((sector) => reserved.add(`${sector.col}_${sector.row}`));
  }
  const emptyCells = (config.sector_definitions.empty || []).filter((sector) => sector.index >= 0);
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0x504f434b) >>> 0);
  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = rng.int(index + 1);
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return shuffled;
  };
  const isActiveMultiPlusCell = (sector) => roundOutcome.multi_plus_triggered
    && (config.multi_plus?.sectors || []).some((item) => item.col === sector.col && item.row === sector.row);
  const fallbackCandidates = emptyCells.filter((sector) => !isActiveMultiPlusCell(sector)
    && !(sector.col === GRID_SIZE - 1 && sector.row === GRID_SIZE - 1)
    && sector.index >= 0);
  const preferredCandidates = fallbackCandidates.filter((sector) => !reserved.has(`${sector.col}_${sector.row}`));
  const orderedCandidates = [
    ...shuffle(preferredCandidates),
    ...shuffle(fallbackCandidates.filter((sector) => !preferredCandidates.includes(sector)))
  ];

  for (const selected of orderedCandidates) {
    const normalized = {
      x: -1 + (selected.col + 0.5) * 2 / GRID_SIZE,
      y: -1 + (selected.row + 0.5) * 2 / GRID_SIZE
    };
    const pocket = {
      col: selected.col,
      row: selected.row,
      index: selected.index,
      x: normalized.x,
      y: normalized.y,
      candidate_count: orderedCandidates.length
    };
    const replacementPool = fallbackCandidates.filter((sector) =>
      !(sector.col === pocket.col && sector.row === pocket.row));
    const replacements = [];
    visitRoundResultTree(roundOutcome.puck_results, (result) => {
      if (result.secret_room || result.category !== "empty" || !result.sector
        || result.sector.col !== pocket.col || result.sector.row !== pocket.row
        || !replacementPool.length) return;
      const replacementRng = window.PuckLuckMath.createRng(
        ((result.visual_seed || roundOutcome.seed) ^ 0x52454d50) >>> 0
      );
      replacements.push({ result, sector: result.sector });
      result.sector = { ...replacementPool[replacementRng.int(replacementPool.length)] };
    });
    if (roundSupportsFieldPocket(roundOutcome, pocket)) {
      roundOutcome.field_pocket = { ...pocket };
      return pocket;
    }
    replacements.forEach(({ result, sector }) => {
      result.sector = sector;
    });
  }
  return null;
}

function planRuntimeFieldPocketTrajectory({
  result,
  seed,
  existingPlans = [],
  startPoint = null,
  releaseIndex = 0
}) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  const pocket = getFieldPocketNormalized();
  if (!planner || !config || !pocket || !result) return null;
  const targetSector = result.secret_room
    ? { col: state.fieldPocket.col, row: state.fieldPocket.row }
    : { ...result.sector };
  const puckRadius = config.puck_radius || 0.1;
  const launchForce = planner.VISUAL_PHYSICS.visual_launch_force;
  const allowAnyDirection = Boolean(startPoint);
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const attemptSeed = (seed ^ Math.imul(attempt + 1, 0x9e3779b1)) >>> 0;
    const landingPoint = result.secret_room
      ? pocket
      : planner.landingPointForVariant(GRID_SIZE, puckRadius, targetSector, attemptSeed, attempt);
    const trajectory = planner.planTrajectory({
      lines: GRID_SIZE,
      puckRadius,
      targetSector,
      seed: attemptSeed,
      launchForce,
      landingPoint,
      candidateOffset: attempt,
      startPoint,
      allowAnyDirection,
      angleCenter: allowAnyDirection ? 0 : -135,
      angleMin: allowAnyDirection ? -180 : -48,
      angleMax: allowAnyDirection ? 180 : 48
    });
    if (!trajectory.valid) continue;
    if (!result.secret_room
      && !planner.trajectoryClearsPockets(trajectory.frames, puckRadius, [pocket])) continue;
    if (trajectoryConflictsWithRound(trajectory, existingPlans, puckRadius)) continue;
    trajectory.id = `field-pocket-${releaseIndex}-${result.result_path || result.visual_seed}-${attempt}`;
    trajectory.target_category = result.category;
    trajectory.recent_usage_count = state.trajectoryUsage[trajectory.id] || 0;
    trajectory.stagger_delay = 0;
    if (result.secret_room) {
      const firstFrame = trajectory.frames[0];
      const captureRadius = puckRadius * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
      trajectory.secret_room = {
        zone_id: FIELD_POCKET_ZONE_ID,
        entry_id: trajectory.id,
        pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
      };
      result.visual_pocket_sector = { ...targetSector };
    }
    return trajectory;
  }
  return null;
}

function buildTrajectoryPlans(roundOutcome) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const trajectoryLibrary = window.PuckLuckTrajectoryLibrary;
  if (!planner || !trajectoryLibrary || !roundOutcome) {
    return { valid: false, reason: "trajectory_planner_unavailable", plans: [] };
  }
  const plans = [];
  const usedThisRound = [];
  roundOutcome.puck_results.forEach((result, puckIndex) => {
    if (usesFieldPocketMechanics() && result.secret_room) {
      const trajectory = planRuntimeFieldPocketTrajectory({
        result,
        seed: (result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0,
        existingPlans: plans.filter((plan) => plan?.valid),
        releaseIndex: puckIndex
      });
      if (!trajectory) {
        plans.push({ valid: false, unreachable_reason: `field_pocket_trajectory_unavailable_${GRID_SIZE}_${puckIndex}` });
      } else {
        plans.push(trajectory);
      }
      return;
    }
    const secretLibrary = window.PuckLuckSecretRoomTrajectories?.library?.[GRID_SIZE];
    const cellId = `${result.sector.col}_${result.sector.row}`;
    const variants = result.secret_room
      ? secretLibrary?.entries?.[result.secret_zone_id] || []
      : getSafeStandardTrajectoryVariants(GRID_SIZE, cellId);
    if (!variants.length) {
      const missingId = result.secret_room ? `secret_${result.secret_zone_id}` : cellId;
      plans.push({ valid: false, unreachable_reason: `missing_precomputed_cell_${GRID_SIZE}_${missingId}` });
      return;
    }
    const rng = window.PuckLuckMath.createRng((result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0);
    const selection = selectDistinctTrajectoryDescriptor({
      variants,
      seed: rng.uint32(),
      result,
      existingPlans: plans.filter((plan) => plan?.valid),
      recentHistorySize: trajectoryLibrary.config.recent_history_size,
      preferEarlyPocketEntry: shouldUseEarlyPocketEntry(result)
    });
    if (!selection) {
      plans.push({ valid: false, unreachable_reason: `duplicate_visual_trajectory_unavailable_${GRID_SIZE}_${cellId}` });
      return;
    }
    const { descriptor, trajectory } = selection;
    if (result.secret_room) {
      const captureFrameIndex = Math.max(1, Math.min(
        descriptor.capture_frame_index ?? trajectory.frames.length - 1,
        trajectory.frames.length - 1
      ));
      trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
      const captureFrame = trajectory.frames.at(-1);
      trajectory.duration = captureFrame[0];
      trajectory.bounce_count = captureFrame[5];
      trajectory.landing_point = { x: captureFrame[1], y: captureFrame[2] };
      // Even-sized grids place the pocket on the intersection of two cells;
      // either adjacent cell is valid while the physical landing point remains exact.
      trajectory.valid = true;
      trajectory.final_sector = { ...result.sector };
      const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, result.secret_zone_id);
      const captureRadius = (getMathConfiguration()?.puck_radius || 0.1)
        * window.PuckLuckTrajectoryPlanner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
      const firstFrame = trajectory.frames[0];
      trajectory.secret_room = {
        zone_id: result.secret_zone_id,
        entry_id: descriptor.id,
        pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
      };
    }
    usedThisRound.push(descriptor.id);
    plans.push(trajectory);
  });
  const invalid = plans.find((plan) => !plan.valid);
  return invalid ? { valid: false, reason: invalid.unreachable_reason, plans } : { valid: true, plans };
}

function ensureUniqueRoundTrajectories(roundOutcome, trajectories) {
  if (!roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "trajectory_uniqueness_unavailable" };
  }
  const puckRadius = getMathConfiguration()?.puck_radius || 0.1;
  for (let firstIndex = 0; firstIndex < trajectories.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < trajectories.length; secondIndex += 1) {
      if (trajectoriesLookDuplicated(trajectories[firstIndex], trajectories[secondIndex], puckRadius)) {
        return { valid: false, reason: `duplicate_visual_trajectory_${firstIndex + 1}_${secondIndex + 1}` };
      }
    }
  }
  return { valid: true };
}

function getFixedBonusSymbolSlots(lines, puckCount) {
  const edgeCellCenter = getSafeCollectibleEdgeCoordinate(lines);
  // The 7x7 library needs stable points on the inner borders of its central edge cells
  // so every authoritative symbol result still has a physical, multiplier-equivalent path.
  const sevenLineOffsets = lines === 7 && puckCount === 2
    ? [-1 / 7, -1 / 7, -1 / 7, -1 / 7]
    : lines === 7 && puckCount === 3
      ? [-1 / 7, -1 / 7, 1 / 7, -0.105]
      : [0, 0, 0, 0];
  const anchors = [
    { side: "top", x: sevenLineOffsets[0], y: -edgeCellCenter },
    { side: "right", x: edgeCellCenter, y: sevenLineOffsets[1] },
    { side: "bottom", x: -sevenLineOffsets[2], y: edgeCellCenter },
    { side: "left", x: -edgeCellCenter, y: -sevenLineOffsets[3] }
  ];
  const diamondSides = lines === 7 && puckCount === 2
    ? [1, 3]
    : lines === 7 && puckCount === 3
      ? [0, 1, 2]
      : puckCount === 1 ? [1] : puckCount === 2 ? [1, 2] : [1, 2, 3];
  const toSlot = (anchorIndex, type, index) => {
    const anchor = anchors[anchorIndex];
    return {
      ...anchor,
      anchorIndex,
      type,
      index,
      col: Math.max(0, Math.min(lines - 1, Math.floor(((anchor.x + 1) / 2) * lines))),
      row: Math.max(0, Math.min(lines - 1, Math.floor(((anchor.y + 1) / 2) * lines)))
    };
  };
  return {
    diamonds: diamondSides.map((anchorIndex, index) => toSlot(anchorIndex, "diamond", index))
  };
}

function distanceToFixedSymbolSegment(symbol, firstFrame, secondFrame) {
  const ax = firstFrame[1];
  const ay = firstFrame[2];
  const dx = secondFrame[1] - ax;
  const dy = secondFrame[2] - ay;
  const lengthSquared = dx * dx + dy * dy;
  const progress = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((symbol.x - ax) * dx + (symbol.y - ay) * dy) / lengthSquared))
    : 0;
  const x = ax + dx * progress;
  const y = ay + dy * progress;
  return { distance: Math.hypot(symbol.x - x, symbol.y - y), progress, x, y };
}

function fixedSymbolPickupPhase(frameIndex, frames, bounceCount) {
  const progress = frameIndex / Math.max(1, frames.length - 1);
  if (progress >= 0.85) return "final_slowdown";
  if (bounceCount >= 4) return "late";
  if (bounceCount >= 2) return "after_2_3_bounces";
  if (bounceCount === 1) return "after_1_bounce";
  return "before_first_bounce";
}

function getFixedTrajectoryMetrics(descriptor, symbols, hitRadius) {
  const cacheKey = `${descriptor.id}|${symbols.map((symbol) => `${symbol.x.toFixed(6)},${symbol.y.toFixed(6)}`).join("|")}`;
  const cached = fixedBonusTrajectoryMetrics.get(cacheKey);
  if (cached) return cached;
  const trajectory = window.PuckLuckTrajectoryPlanner.hydrateTrajectory(descriptor);
  const pickups = symbols.map((symbol) => {
    let best = null;
    for (let frameIndex = 1; frameIndex < trajectory.frames.length; frameIndex += 1) {
      const first = trajectory.frames[frameIndex - 1];
      const second = trajectory.frames[frameIndex];
      const candidate = distanceToFixedSymbolSegment(symbol, first, second);
      if (!best || candidate.distance < best.distance) {
        const time = first[0] + (second[0] - first[0]) * candidate.progress;
        const bounceCount = candidate.progress < 0.5 ? first[5] : second[5];
        best = {
          distance: candidate.distance,
          t: time,
          bounce_count: bounceCount,
          frame_index: frameIndex,
          phase: fixedSymbolPickupPhase(frameIndex, trajectory.frames, bounceCount)
        };
      }
    }
    return best;
  });
  const mask = pickups.reduce((value, pickup, index) => value | (pickup.distance <= hitRadius ? 1 << index : 0), 0);
  const metrics = { mask, pickups };
  fixedBonusTrajectoryMetrics.set(cacheKey, metrics);
  return metrics;
}

function fixedResultSectorPool(result, config) {
  const currentKey = `${result.sector.col}_${result.sector.row}`;
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  let sectors;
  if (result.category === "empty") {
    sectors = (config.sector_definitions.empty || []).filter((sector) => sector.index >= 0
      && sector.index !== launchIndex);
  } else {
    sectors = config.sector_definitions[result.category] || [];
  }
  return [...sectors].sort((first, second) => {
    const firstCurrent = `${first.col}_${first.row}` === currentKey ? 0 : 1;
    const secondCurrent = `${second.col}_${second.row}` === currentKey ? 0 : 1;
    return firstCurrent - secondCurrent || first.index - second.index;
  });
}

function collectFixedTrajectoryOptions(result, config, symbols, hitRadius, currentCellOnly, sectorLimit = Infinity) {
  const library = window.PuckLuckTrajectoryLibrary;
  const currentKey = `${result.sector.col}_${result.sector.row}`;
  const recentIds = new Set(state.recentTrajectoryIds.slice(-library.config.recent_history_size));
  const sectors = fixedResultSectorPool(result, config)
    .filter((sector) => !currentCellOnly || `${sector.col}_${sector.row}` === currentKey)
    .slice(0, sectorLimit);
  const optionsByMask = new Map();
  sectors.forEach((sector) => {
    const variants = getSafeStandardTrajectoryVariants(GRID_SIZE, `${sector.col}_${sector.row}`);
    variants.forEach((descriptor) => {
      const metrics = getFixedTrajectoryMetrics(descriptor, symbols, hitRadius);
      const option = {
        descriptor,
        metrics,
        mask: metrics.mask,
        sector,
        score: (`${sector.col}_${sector.row}` === currentKey ? 0 : 1000)
          + (recentIds.has(descriptor.id) ? 200 : 0)
          + (state.trajectoryUsage[descriptor.id] || 0) * 10
      };
      const bucket = optionsByMask.get(option.mask) || [];
      bucket.push(option);
      bucket.sort((first, second) => first.score - second.score || first.descriptor.id.localeCompare(second.descriptor.id));
      optionsByMask.set(option.mask, bucket.slice(0, 6));
    });
  });
  return [...optionsByMask.values()].flat();
}

function findFixedTrajectoryCombination(optionsByPuck, diamondMask, collectedDiamonds) {
  let states = new Map([[0, { unionMask: 0, choices: [], score: 0 }]]);
  optionsByPuck.forEach((options) => {
    const next = new Map();
    states.forEach((stateEntry) => {
      options.forEach((option) => {
        if (stateEntry.choices.some((choice) =>
          descriptorsLookDuplicated(choice.descriptor, option.descriptor, option.descriptor.puck_radius))) return;
        const unionMask = stateEntry.unionMask | option.mask;
        const key = unionMask;
        const candidate = {
          unionMask,
          choices: [...stateEntry.choices, option],
          score: stateEntry.score + option.score
        };
        const current = next.get(key);
        if (!current || candidate.score < current.score) next.set(key, candidate);
      });
    });
    states = next;
  });
  const popcount = (value) => {
    let count = 0;
    for (let bits = value; bits; bits >>>= 1) count += bits & 1;
    return count;
  };
  return [...states.values()]
    .filter((entry) => {
      return popcount(entry.unionMask & diamondMask) === collectedDiamonds;
    })
    .sort((first, second) => first.score - second.score)[0] || null;
}

function buildFixedBonusSymbolPlan(roundOutcome, trajectories) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  if (!planner || !config || !roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "fixed_symbol_planner_unavailable" };
  }
  const slots = getFixedBonusSymbolSlots(GRID_SIZE, state.puckCount);
  const symbols = slots.diamonds;
  const diamondMask = (1 << symbols.length) - 1;
  const hitRadius = config.puck_radius * 1.56;
  const desiredDiamonds = roundOutcome.bonus_triggered ? state.puckCount : roundOutcome.stars_collected;

  let optionsByPuck = roundOutcome.puck_results.map((result) =>
    collectFixedTrajectoryOptions(result, config, symbols, hitRadius, true));
  let combination = findFixedTrajectoryCombination(optionsByPuck, diamondMask, desiredDiamonds);
  if (!combination) {
    for (const sectorLimit of [6, 16, Infinity]) {
      optionsByPuck = roundOutcome.puck_results.map((result) =>
        collectFixedTrajectoryOptions(result, config, symbols, hitRadius, false, sectorLimit));
      combination = findFixedTrajectoryCombination(optionsByPuck, diamondMask, desiredDiamonds);
      if (combination) break;
    }
  }
  if (!combination) return { valid: false, reason: "fixed_symbol_trajectory_combination_unavailable" };

  combination.choices.forEach((choice, puckIndex) => {
    const result = roundOutcome.puck_results[puckIndex];
    const previous = trajectories[puckIndex];
    const replacement = planner.hydrateTrajectory(choice.descriptor);
    replacement.target_category = result.category;
    replacement.recent_usage_count = state.trajectoryUsage[choice.descriptor.id] || 0;
    replacement.stagger_delay = previous?.stagger_delay || 0;
    trajectories[puckIndex] = replacement;
    result.sector = { ...choice.descriptor.target_sector };
    result.multiplier = choice.sector.multiplier ?? config.multiplier_table[result.category];
  });

  const assignedPickup = (symbolIndex) => {
    const candidates = combination.choices.map((choice, puckIndex) => ({
      puckIndex,
      touched: Boolean(choice.mask & (1 << symbolIndex)),
      pickup: choice.metrics.pickups[symbolIndex]
    })).filter((candidate) => candidate.touched)
      .sort((first, second) => first.pickup.t - second.pickup.t);
    return candidates[0] || null;
  };
  const stars = slots.diamonds.map((slot, diamondIndex) => {
    const symbolIndex = diamondIndex;
    const assignment = assignedPickup(symbolIndex);
    return {
      index: slot.row * GRID_SIZE + slot.col,
      x: slot.x,
      y: slot.y,
      row: slot.row,
      col: slot.col,
      collected: Boolean(assignment),
      assigned_puck: assignment?.puckIndex ?? -1,
      collect_time: assignment?.pickup.t ?? null,
      pickup_bounce_count: assignment?.pickup.bounce_count ?? null,
      pickup_phase: assignment?.pickup.phase || "not_collected",
      fixed_side: slot.side
    };
  });
  roundOutcome.star_positions = stars;
  roundOutcome.stars_collected = stars.filter((star) => star.collected).length;
  roundOutcome.fixed_bonus_symbols = true;
  return { valid: true, stars, mode: "fixed" };
}

function buildVisualStarPlanLegacy(roundOutcome, trajectories) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  if (!planner || !config || !roundOutcome) {
    return { valid: false, reason: "star_planner_unavailable" };
  }
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const eligibleStarCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex);
  const eligibleStarCellKeys = new Set(eligibleStarCells.map((sector) => `${sector.col}_${sector.row}`));
  const collectedNeeded = roundOutcome.bonus_triggered ? state.puckCount : roundOutcome.stars_collected;
  let candidatesByPuck;
  let touchedCells;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    candidatesByPuck = trajectories.map((trajectory) => planner.findStarCandidates(trajectory, GRID_SIZE, config.puck_radius)
      .filter((candidate) => eligibleStarCellKeys.has(`${candidate.col}_${candidate.row}`)
        && collectibleSymbolClearsFieldObstaclesNormalized(candidate.x, candidate.y, config.puck_radius * 0.56)));
    touchedCells = new Set(candidatesByPuck.flat().map((candidate) => `${candidate.col}_${candidate.row}`));
    if (touchedCells.size >= collectedNeeded) break;
    trajectories.forEach((trajectory, puckIndex) => {
      const result = roundOutcome.puck_results[puckIndex];
      if (result.secret_room) return;
      const cellId = `${result.sector.col}_${result.sector.row}`;
      const variants = getSafeStandardTrajectoryVariants(GRID_SIZE, cellId);
      const selection = selectDistinctTrajectoryDescriptor({
        variants,
        seed: (roundOutcome.seed + attempt * 7 + puckIndex * 13) >>> 0,
        result,
        existingPlans: trajectories.filter((_, index) => index !== puckIndex),
        staggerDelay: trajectory.stagger_delay,
        recentHistorySize: window.PuckLuckTrajectoryLibrary.config.recent_history_size
      });
      if (selection) trajectories[puckIndex] = selection.trajectory;
    });
  }
  if (touchedCells.size < collectedNeeded) {
    return { valid: false, reason: "insufficient_empty_star_cells_for_precomputed_paths" };
  }
  const used = new Set();
  const stars = [];
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0xa53c9e17) >>> 0);
  const phaseWeights = [
    ["before_first_bounce", 0.15],
    ["after_1_bounce", 0.25],
    ["after_2_3_bounces", 0.25],
    ["late", 0.25],
    ["final_slowdown", 0.10]
  ];
  function choosePhase() {
    let roll = rng.next();
    for (const [phase, weight] of phaseWeights) {
      roll -= weight;
      if (roll <= 0) return phase;
    }
    return "final_slowdown";
  }
  let previousPhase = null;
  for (let starIndex = 0; starIndex < collectedNeeded; starIndex += 1) {
    let selected = null;
    let desiredPhase = choosePhase();
    if (collectedNeeded > 1 && desiredPhase === previousPhase) {
      const phaseIndex = phaseWeights.findIndex(([phase]) => phase === desiredPhase);
      desiredPhase = phaseWeights[(phaseIndex + 1 + rng.int(phaseWeights.length - 1)) % phaseWeights.length][0];
    }
    for (let offset = 0; offset < trajectories.length && !selected; offset += 1) {
      const puckIndex = (starIndex + offset) % trajectories.length;
      const phaseCandidates = candidatesByPuck[puckIndex].filter((item) => item.phase === desiredPhase && !used.has(`${item.col}_${item.row}`));
      const fallbackCandidates = candidatesByPuck[puckIndex].filter((item) => !used.has(`${item.col}_${item.row}`));
      const source = phaseCandidates.length ? phaseCandidates : fallbackCandidates;
      const candidate = source.length ? source[rng.int(source.length)] : null;
      if (candidate) selected = { ...candidate, puckIndex };
    }
    if (!selected) return { valid: false, reason: "insufficient_collectible_star_cells" };
    const key = `${selected.col}_${selected.row}`;
    used.add(key);
    stars.push({
      index: selected.row * GRID_SIZE + selected.col,
      x: selected.x,
      y: selected.y,
      row: selected.row,
      col: selected.col,
      collected: true,
      assigned_puck: selected.puckIndex,
      collect_time: selected.t,
      pickup_bounce_count: selected.bounce_count,
      pickup_phase: selected.phase
    });
    previousPhase = selected.phase;
  }
  const fallbackCells = [];
  eligibleStarCells.forEach(({ index, row, col }) => {
    const key = `${col}_${row}`;
    if (used.has(key)) return;
    const item = { index, row, col, key };
    fallbackCells.push(item);
  });
  function takeRandomCell(pool) {
    if (!pool.length) return null;
    const offset = rng.int(pool.length);
    const [cell] = pool.splice(offset, 1);
    const duplicate = fallbackCells.findIndex((item) => item.key === cell.key);
    if (duplicate >= 0) fallbackCells.splice(duplicate, 1);
    return cell;
  }
  function findFreeStarPosition(fallbackCell) {
    const starRadius = config.puck_radius * 0.56;
    const pathMargin = config.puck_radius + starRadius + 0.018;
    const minimumStarGap = starRadius * 2.5;
    const cellSize = 2 / GRID_SIZE;
    const padding = starRadius + 0.014;
    const left = -1 + fallbackCell.col * cellSize + padding;
    const right = -1 + (fallbackCell.col + 1) * cellSize - padding;
    const top = -1 + fallbackCell.row * cellSize + padding;
    const bottom = -1 + (fallbackCell.row + 1) * cellSize - padding;
    for (let attempt = 0; attempt < 240; attempt += 1) {
      const x = left + rng.next() * Math.max(0, right - left);
      const y = top + rng.next() * Math.max(0, bottom - top);
      if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, starRadius)) continue;
      const overlapsStar = stars.some((star) => Number.isFinite(star.x) && Number.isFinite(star.y)
        && Math.hypot(x - star.x, y - star.y) < minimumStarGap);
      if (overlapsStar) continue;
      const touchesPath = trajectories.some((trajectory) => trajectory.frames.some((frame) =>
        Math.hypot(x - frame[1], y - frame[2]) < pathMargin));
      if (touchesPath) continue;
      return {
        x,
        y,
        col: fallbackCell.col,
        row: fallbackCell.row
      };
    }
    return null;
  }
  while (stars.length < state.puckCount) {
    let cell = null;
    let position = null;
    while (fallbackCells.length && !position) {
      cell = takeRandomCell(fallbackCells);
      position = findFreeStarPosition(cell);
    }
    if (!cell || !position) return { valid: false, reason: "insufficient_uncollected_star_cells" };
    stars.push({
      ...cell,
      ...position,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null,
      pickup_phase: "not_collected"
    });
  }
  roundOutcome.star_positions = stars;
  roundOutcome.stars_collected = stars.filter((star) => star.collected).length;
  return { valid: true, stars };
}

function buildVisualMultiPlusPlanLegacy(roundOutcome, trajectories) {
  const config = getMathConfiguration();
  if (!config || !roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "multi_plus_planner_unavailable" };
  }
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0x4d554c54) >>> 0);
  const tokenRadius = config.puck_radius * 0.56;
  const borderMargin = tokenRadius + 0.018;
  const minimumTokenGap = tokenRadius * 2.7;
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const stars = roundOutcome.star_positions || [];
  const starCellKeys = new Set(stars.map((star) => `${star.col}_${star.row}`));
  const multiPlusCellKeys = new Set((config.multi_plus?.sectors || []).map((sector) => `${sector.col}_${sector.row}`));
  const emptyCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex
    && !starCellKeys.has(`${sector.col}_${sector.row}`)
    && (!roundOutcome.multi_plus_triggered || !multiPlusCellKeys.has(`${sector.col}_${sector.row}`)));
  if (!emptyCells.length) {
    return { valid: false, reason: "no_empty_cells_for_multi_plus_token" };
  }
  const emptyCellKeys = new Set(emptyCells.map((sector) => `${sector.col}_${sector.row}`));
  const clearsStars = (x, y) => stars.every((star) => !Number.isFinite(star.x) || !Number.isFinite(star.y)
    || Math.hypot(x - star.x, y - star.y) >= minimumTokenGap);

  if (roundOutcome.multi_plus_triggered) {
    const candidates = [];
    const preferredPuck = Math.max(0, roundOutcome.puck_results.findIndex((result) => result.multi_plus));
    const puckOrder = [preferredPuck, ...trajectories.map((_, index) => index).filter((index) => index !== preferredPuck)];
    puckOrder.forEach((puckIndex, orderIndex) => {
      const trajectory = trajectories[puckIndex];
      const frames = trajectory?.frames || [];
      for (let index = 1; index < frames.length - 1; index += 3) {
        const frame = frames[index];
        const progress = index / (frames.length - 1);
        const x = frame[1];
        const y = frame[2];
        const cell = {
          col: clamp(Math.floor(((x + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1),
          row: clamp(Math.floor(((y + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1)
        };
        if (progress < 0.08 || progress > 0.72) continue;
        if (Math.abs(x) > 1 - borderMargin || Math.abs(y) > 1 - borderMargin) continue;
        if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, tokenRadius)) continue;
        if (!emptyCellKeys.has(`${cell.col}_${cell.row}`)) continue;
        if (!clearsStars(x, y)) continue;
        candidates.push({ frame, index, progress, puckIndex, orderIndex });
      }
    });
    if (!candidates.length) {
      return { valid: false, reason: "no_collectible_multi_plus_position" };
    }
    candidates.sort((first, second) => first.orderIndex - second.orderIndex
      || Math.abs(first.progress - 0.32) - Math.abs(second.progress - 0.32));
    const bestOrder = candidates[0].orderIndex;
    const preferredCandidates = candidates.filter((candidate) => candidate.orderIndex === bestOrder);
    const selected = preferredCandidates[rng.int(preferredCandidates.length)];
    const frame = selected.frame;
    roundOutcome.multi_plus_assigned_puck = selected.puckIndex;
    roundOutcome.puck_results.forEach((result, index) => {
      result.multi_plus = index === selected.puckIndex;
    });
    roundOutcome.multi_plus_position = {
      x: frame[1],
      y: frame[2],
      col: clamp(Math.floor(((frame[1] + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1),
      row: clamp(Math.floor(((frame[2] + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1),
      collected: true,
      assigned_puck: selected.puckIndex,
      collect_time: frame[0],
      pickup_bounce_count: frame[5]
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }

  const pathMargin = config.puck_radius + tokenRadius + 0.034;
  const secretPocketPoints = {
    top: [0, -1],
    right: [1, 0],
    bottom: [0, 1],
    left: [-1, 0]
  };
  const pointToSegmentDistance = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0
      ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0, 1)
      : 0;
    const closestX = ax + dx * t;
    const closestY = ay + dy * t;
    return Math.hypot(x - closestX, y - closestY);
  };
  const pathSegments = trajectories.flatMap((trajectory) => {
    const frames = trajectory.frames || [];
    const segments = [];
    for (let index = 1; index < frames.length; index += 1) {
      segments.push([frames[index - 1][1], frames[index - 1][2], frames[index][1], frames[index][2]]);
    }
    const pocketPoint = trajectory.secret_room?.zone_id === FIELD_POCKET_ZONE_ID
      ? (() => {
        const point = getFieldPocketNormalized();
        return point ? [point.x, point.y] : null;
      })()
      : secretPocketPoints[trajectory.secret_room?.zone_id];
    if (pocketPoint && frames.length) {
      const lastFrame = frames.at(-1);
      segments.push([lastFrame[1], lastFrame[2], pocketPoint[0], pocketPoint[1]]);
    }
    return segments;
  });
  const touchesAnyPuckPath = (x, y) => pathSegments.some(([ax, ay, bx, by]) =>
    pointToSegmentDistance(x, y, ax, ay, bx, by) < pathMargin);
  const cellSize = 2 / GRID_SIZE;
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const cell = emptyCells[rng.int(emptyCells.length)];
    const padding = tokenRadius + 0.014;
    const left = Math.max(-1 + borderMargin, -1 + cell.col * cellSize + padding);
    const right = Math.min(1 - borderMargin, -1 + (cell.col + 1) * cellSize - padding);
    const top = Math.max(-1 + borderMargin, -1 + cell.row * cellSize + padding);
    const bottom = Math.min(1 - borderMargin, -1 + (cell.row + 1) * cellSize - padding);
    const x = left + rng.next() * Math.max(0, right - left);
    const y = top + rng.next() * Math.max(0, bottom - top);
    if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, tokenRadius)) continue;
    if (!clearsStars(x, y)) continue;
    if (touchesAnyPuckPath(x, y)) continue;
    roundOutcome.multi_plus_position = {
      x,
      y,
      col: cell.col,
      row: cell.row,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }
  const fallback = findSafeUncollectedSymbolPosition({
    roundOutcome,
    config,
    trajectories,
    radius: tokenRadius,
    occupied: stars.filter((star) => Number.isFinite(star.x) && Number.isFinite(star.y))
      .map((star) => ({ x: star.x, y: star.y, radius: tokenRadius })),
    forbiddenCellKeys: new Set(),
    salt: 0x4d554c54
  });
  if (fallback) {
    roundOutcome.multi_plus_position = {
      ...fallback,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }
  return { valid: false, reason: "no_safe_multi_plus_position" };
}

function normalizedDistanceToTrajectory(x, y, trajectory) {
  const frames = trajectory?.frames || [];
  let minimum = Infinity;
  for (let index = 1; index < frames.length; index += 1) {
    minimum = Math.min(minimum,
      distanceToFixedSymbolSegment({ x, y }, frames[index - 1], frames[index]).distance);
  }
  return minimum;
}

function findSafeUncollectedSymbolPosition({
  roundOutcome,
  config,
  trajectories,
  radius,
  occupied,
  forbiddenCellKeys,
  salt
}) {
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const primaryCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex
    && !forbiddenCellKeys.has(`${sector.col}_${sector.row}`));
  const primaryKeys = new Set(primaryCells.map((sector) => `${sector.col}_${sector.row}`));
  const fallbackCells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) for (let col = 0; col < GRID_SIZE; col += 1) {
    const index = row * GRID_SIZE + col;
    const key = `${col}_${row}`;
    if (index === launchIndex || primaryKeys.has(key) || forbiddenCellKeys.has(key)) continue;
    fallbackCells.push({ index, col, row });
  }
  const cellPools = [primaryCells, fallbackCells].filter((pool) => pool.length);
  if (!cellPools.length) return null;
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ salt) >>> 0);
  const cellSize = 2 / GRID_SIZE;
  const padding = radius + 0.014;
  const pathClearance = config.puck_radius + radius + 0.018;
  for (const cells of cellPools) {
    for (let attempt = 0; attempt < 2400; attempt += 1) {
      const cell = cells[rng.int(cells.length)];
      const left = -1 + cell.col * cellSize + padding;
      const right = -1 + (cell.col + 1) * cellSize - padding;
      const top = -1 + cell.row * cellSize + padding;
      const bottom = -1 + (cell.row + 1) * cellSize - padding;
      const x = left + rng.next() * Math.max(0, right - left);
      const y = top + rng.next() * Math.max(0, bottom - top);
      if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, radius)) continue;
      if (occupied.some((symbol) => Math.hypot(x - symbol.x, y - symbol.y)
        < radius + symbol.radius + 0.02)) continue;
      if (trajectories.some((trajectory) =>
        normalizedDistanceToTrajectory(x, y, trajectory) <= pathClearance)) continue;
      return { x, y, col: cell.col, row: cell.row, index: cell.index };
    }
  }
  return null;
}

function reconcileUncollectedSymbols(roundOutcome, config, trajectories) {
  const stars = roundOutcome.star_positions || [];
  const token = roundOutcome.multi_plus_position;
  const symbolRadius = config.puck_radius * 0.56;
  const pathClearance = config.puck_radius + symbolRadius + 0.018;
  const forbiddenCellKeys = new Set(roundOutcome.multi_plus_triggered
    ? (config.multi_plus?.sectors || []).map((sector) => `${sector.col}_${sector.row}`)
    : []);
  const occupied = [];
  const relocateIfNeeded = (symbol, salt, reason) => {
    if (!symbol || symbol.collected) {
      if (symbol && Number.isFinite(symbol.x) && Number.isFinite(symbol.y)) {
        occupied.push({ x: symbol.x, y: symbol.y, radius: symbolRadius });
      }
      return { valid: true };
    }
    const crossesPath = trajectories.some((trajectory) =>
      normalizedDistanceToTrajectory(symbol.x, symbol.y, trajectory) <= pathClearance);
    const overlapsSymbol = occupied.some((item) =>
      Math.hypot(symbol.x - item.x, symbol.y - item.y) < symbolRadius + item.radius + 0.02);
    if (crossesPath || overlapsSymbol) {
      const replacement = findSafeUncollectedSymbolPosition({
        roundOutcome,
        config,
        trajectories,
        radius: symbolRadius,
        occupied,
        forbiddenCellKeys,
        salt
      });
      if (!replacement) return { valid: false, reason };
      Object.assign(symbol, replacement);
    }
    occupied.push({ x: symbol.x, y: symbol.y, radius: symbolRadius });
    return { valid: true };
  };

  for (let index = 0; index < stars.length; index += 1) {
    const result = relocateIfNeeded(stars[index], 0x53544152 ^ Math.imul(index + 1, 0x9e3779b1),
      `no_safe_uncollected_diamond_${index}`);
    if (!result.valid) return result;
  }
  return relocateIfNeeded(token, 0x4d554c54, "no_safe_uncollected_multi_plus");
}

function assignPlannedSymbolsToPocketRelease(roundOutcome, pocketReleasePlan, mainTrajectories = []) {
  const config = getMathConfiguration();
  const planner = window.PuckLuckTrajectoryPlanner;
  const plans = pocketReleasePlan?.plans || [];
  if (!config || !planner) return { valid: false, reason: "pocket_symbol_dependencies_unavailable" };
  const allTrajectories = [...mainTrajectories, ...plans.map((plan) => plan.trajectory)].filter(Boolean);
  const emptyKeys = new Set((config.sector_definitions.empty || [])
    .filter((sector) => sector.index >= 0)
    .map((sector) => `${sector.col}_${sector.row}`));
  const symbolRadius = config.puck_radius * 0.56;
  const stars = roundOutcome.star_positions || [];
  const candidates = [];
  plans.forEach(({ result, trajectory }, planIndex) => {
    planner.findStarCandidates(trajectory, GRID_SIZE, config.puck_radius).forEach((candidate) => {
      if (!emptyKeys.has(`${candidate.col}_${candidate.row}`)) return;
      if (!collectibleSymbolClearsFieldObstaclesNormalized(candidate.x, candidate.y, symbolRadius)) return;
      const mainPathClearance = config.puck_radius + symbolRadius + 0.018;
      if (mainTrajectories.some((mainTrajectory) =>
        normalizedDistanceToTrajectory(candidate.x, candidate.y, mainTrajectory) <= mainPathClearance)) return;
      candidates.push({ ...candidate, result, trajectory, planIndex });
    });
  });
  candidates.sort((first, second) => first.planIndex - second.planIndex
    || Math.abs(first.t / Math.max(0.001, first.trajectory.duration) - 0.36)
      - Math.abs(second.t / Math.max(0.001, second.trajectory.duration) - 0.36));

  const assignedCandidates = [];
  const usedResultPaths = new Set();
  stars.filter((star) => star.collected).forEach((collectedStar) => {
    const clearsAssigned = (candidate) => assignedCandidates.every((assigned) =>
      Math.hypot(candidate.x - assigned.x, candidate.y - assigned.y) >= symbolRadius * 2.5);
    const starCandidate = candidates.find((candidate) =>
      !usedResultPaths.has(candidate.result.result_path) && clearsAssigned(candidate))
      || candidates.find(clearsAssigned);
    if (!starCandidate) return;
    Object.assign(collectedStar, {
      index: starCandidate.row * GRID_SIZE + starCandidate.col,
      x: starCandidate.x,
      y: starCandidate.y,
      row: starCandidate.row,
      col: starCandidate.col,
      assigned_puck: -1,
      assigned_result_path: starCandidate.result.result_path,
      collect_time: starCandidate.t,
      pickup_bounce_count: starCandidate.bounce_count,
      pickup_phase: starCandidate.phase,
      collected_by_bonus_ball: true
    });
    assignedCandidates.push(starCandidate);
    usedResultPaths.add(starCandidate.result.result_path);
  });

  if (roundOutcome.multi_plus_triggered && roundOutcome.multi_plus_position) {
    const tokenCandidate = candidates.find((candidate) => stars.every((star) =>
      !Number.isFinite(star.x) || !Number.isFinite(star.y)
      || Math.hypot(candidate.x - star.x, candidate.y - star.y) >= symbolRadius * 2.7));
    if (tokenCandidate) {
      roundOutcome.multi_plus_assigned_puck = -1;
      roundOutcome.puck_results.forEach((result) => { result.multi_plus = false; });
      roundOutcome.multi_plus_position = {
        x: tokenCandidate.x,
        y: tokenCandidate.y,
        col: tokenCandidate.col,
        row: tokenCandidate.row,
        collected: true,
        assigned_puck: -1,
        assigned_result_path: tokenCandidate.result.result_path,
        collect_time: tokenCandidate.t,
        pickup_bounce_count: tokenCandidate.bounce_count,
        collected_by_bonus_ball: true
      };
    }
  }
  return reconcileUncollectedSymbols(roundOutcome, config, allTrajectories);
}

function normalizeAuthoritativeResult(outcomePlan) {
  if (!outcomePlan) return null;
  const target = outcomePlan.sector || { col: GRID_SIZE - 1, row: GRID_SIZE - 1 };
  return {
    ...outcomePlan,
    col: target.col,
    row: target.row,
    category: outcomePlan.category,
    multiplier: outcomePlan.multiplier,
    secretRoom: Boolean(outcomePlan.secret_room),
    secretZoneId: outcomePlan.secret_zone_id || null,
    pocketRelease: Boolean(outcomePlan.pocket_release)
  };
}

function createPuck(index, count, outcomePlan = null, trajectory = null) {
  const { half, puckRadius } = state.field;
  const start = half - puckRadius * 1.8;
  const spread = count === 1 ? 0 : (index - (count - 1) / 2) * 2.5;
  const angleOffset = (outcomePlan?.launch_angle_degrees || 0) + spread;
  const angle = (-135 + angleOffset) * Math.PI / 180;
  const speed = outcomePlan?.launch_force || getMathConfiguration()?.fixed_launch_force || 1250;
  const target = outcomePlan?.sector || { col: GRID_SIZE - 1, row: GRID_SIZE - 1 };
  const firstFrame = trajectory?.frames?.[0];

  const puck = {
    x: firstFrame ? firstFrame[1] * half : start,
    y: firstFrame ? firstFrame[2] * half : start,
    vx: firstFrame ? firstFrame[3] * half : Math.cos(angle) * speed,
    vy: firstFrame ? firstFrame[4] * half : Math.sin(angle) * speed,
    speed,
    age: 0,
    bounceCount: 0,
    requiredBounces: outcomePlan?.required_bounces || 3,
    visualRngState: (outcomePlan?.visual_seed || (index + 1) * 2654435761) >>> 0,
    authoritativeResult: normalizeAuthoritativeResult(outcomePlan),
    replayTrajectory: trajectory,
    replayFrame: 0,
    replayCursor: 0,
    replayDelayFrames: Math.round((trajectory?.stagger_delay || 0) / FIXED_PHYSICS_STEP),
    pocketDepth: 0,
    purpleBoost: false,
    pocketRelease: false,
    purpleReturnTargetSector: outcomePlan?.secret_room ? choosePurpleReturnSector(outcomePlan) : null,
    secretRoom: trajectory?.secret_room ? {
      zoneId: trajectory.secret_room.zone_id,
      phase: "entry",
      pocketCaptureArmed: Boolean(trajectory.secret_room.pocket_capture_armed),
      roomCursor: 0,
      roomFrame: 0
    } : null,
    stopped: false,
    result: null
  };
  return puck;
}

function createBonusStars() {
  const { half, grid, puckRadius } = state.field;
  const starRadius = puckRadius * 0.56;
  if (state.roundOutcome?.star_positions) {
    return state.roundOutcome.star_positions.map((star, index) => ({
      x: Number.isFinite(star.x) ? star.x * half : -half + grid * (star.col + 0.5),
      y: Number.isFinite(star.y) ? star.y * half : -half + grid * (star.row + 0.5),
      col: star.col,
      row: star.row,
      radius: starRadius,
      shouldCollect: star.collected,
      assignedPuck: star.assigned_puck ?? index % state.puckCount,
      assignedResultPath: star.assigned_result_path || null,
      collectAfter: star.collect_time ?? 1.25 + index * 0.55,
      pickupBounceCount: star.pickup_bounce_count ?? null,
      pickupPhase: star.pickup_phase || (star.collected ? "unspecified" : "not_collected"),
      collected: false
    }));
  }
  const cells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const isLaunchCorner = col === GRID_SIZE - 1 && row === GRID_SIZE - 1;
      if (!isLaunchCorner) {
        cells.push({ col, row });
      }
    }
  }

  const stars = [];
  const fallbackRng = window.PuckLuckMath.createRng((state.roundOutcome?.seed || 1) ^ 0x53544152);
  const borderMargin = starRadius + 4;
  while (stars.length < getRequiredStars() && cells.length > 0) {
    const index = fallbackRng.int(cells.length);
    const [cell] = cells.splice(index, 1);
    let x;
    let y;
    let placed = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      x = -half + borderMargin + fallbackRng.next() * (half * 2 - borderMargin * 2);
      y = -half + borderMargin + fallbackRng.next() * (half * 2 - borderMargin * 2);
      if (!collectibleSymbolClearsFieldObstaclesLocal(x, y, starRadius)) continue;
      if (stars.every((star) => Math.hypot(x - star.x, y - star.y) >= starRadius * 2.5)) {
        placed = true;
        break;
      }
    }
    if (!placed) continue;
    stars.push({
      x,
      y,
      col: cell.col,
      row: cell.row,
      radius: starRadius,
      shouldCollect: true,
      collected: false
    });
  }
  return stars;
}

function createMultiPlusToken() {
  const token = state.roundOutcome?.multi_plus_position;
  if (!token) return null;
  return {
    x: token.x * state.field.half,
    y: token.y * state.field.half,
    col: token.col,
    row: token.row,
    radius: state.field.puckRadius * 0.56,
    shouldCollect: token.collected,
    assignedPuck: token.assigned_puck,
    assignedResultPath: token.assigned_result_path || null,
    collectAfter: token.collect_time,
    pickupBounceCount: token.pickup_bounce_count,
    collected: false
  };
}

function launchBonusPuck() {
  if (!state.running) {
    return;
  }

  const puck = createPuck(0, 1);
  puck.bonus = true;
  state.pucks.push(puck);
  playLaunchSound();
}

function collectBonusStarByTouch(puck) {
  for (let index = state.bonusStars.length - 1; index >= 0; index -= 1) {
    const star = state.bonusStars[index];
    if (star.collected || !star.shouldCollect || star.assignedResultPath) {
      continue;
    }

    const hitRadius = state.field.puckRadius + star.radius + 2;
    if (distanceToPuckSegment(puck, star) > hitRadius) {
      continue;
    }

    collectBonusStar(index, puck);
    return;
  }
}

function markSettledCellAsBoosted(puck) {
  const puckIndex = state.pucks.indexOf(puck);
  state.settledCells.forEach((cell) => {
    if (cell.puckIndex === puckIndex) cell.purpleBoost = true;
  });
}

function upgradeSettledResultToX10(puck, { animate = true, playSound = true } = {}) {
  const result = puck?.result;
  if (!result || result.multiplier <= 0 || result.secretRoom || result.x10Boosted) {
    return false;
  }
  const basePayout = Number.isFinite(result.basePayout)
    ? result.basePayout
    : Number.isFinite(result.payout)
      ? result.payout
      : state.activeBetPerPuck * result.multiplier;
  const boostedPayout = basePayout * 10;
  result.basePayout = basePayout;
  result.x10Boosted = true;
  result.boostFromMultiplier = result.multiplier;
  result.boostRevealStartedAt = animate && state.animationsEnabled ? performance.now() : 0;
  result.payout = boostedPayout;
  const payoutDelta = boostedPayout - basePayout;
  if (payoutDelta > 0) {
    state.bankroll += payoutDelta;
    state.roundWinAmount += payoutDelta;
  }
  markSettledCellAsBoosted(puck);
  if (playSound) playMultiplierResultSound(result.multiplier, true);
  return true;
}

function activateX10Boost() {
  if (state.x10BoostActivated) return;
  state.x10BoostActivated = true;
  state.crownBonusAwarded = true;
  const upgradedResults = state.pucks.filter((puck) => upgradeSettledResultToX10(puck));
  if (upgradedResults.length) {
    updateBank();
    updateRoundWinLabel();
    startResultRevealAnimation();
  }
}

function collectBonusStar(index, collector = null) {
  const star = state.bonusStars[index];
  if (!star || star.collected) {
    return;
  }
  star.collected = true;
  const pickupPuck = collector || state.pucks[star.assignedPuck];
  state.starPickupLog.push({
    star_index: state.roundOutcome?.star_positions?.findIndex((item) => item.col === star.col && item.row === star.row) ?? index,
    time: Number((pickupPuck?.age || 0).toFixed(4)),
    bounce_count: pickupPuck?.bounceCount || pickupPuck?.secretBounceCount || 0,
    phase: star.pickupPhase,
    collector_result_path: pickupPuck?.authoritativeResult?.result_path || "main"
  });
  const counterFlyIn = spawnCounterFlyIn(
    "diamond",
    toScreen(star.x, star.y),
    getCrownCounterTargetPoint(state.crownsCollected),
    star.radius
  );
  state.bonusStars.splice(index, 1);
  state.crownsCollected = Math.min(getRequiredStars(), state.crownsCollected + 1);
  updateCrownCounter();
  if (state.crownsCollected >= getRequiredStars()) {
    if (state.roundOutcome?.bonus_triggered) activateX10Boost();
    if (counterFlyIn) {
      counterFlyIn.onComplete = bubbleBonusCounter;
    } else {
      bubbleBonusCounter();
    }
    playBonusCompleteSound();
  } else {
    playBonusStarSound(state.crownsCollected);
  }
}

function distanceToPuckSegment(puck, target) {
  const startX = Number.isFinite(puck.previousX) ? puck.previousX : puck.x;
  const startY = Number.isFinite(puck.previousY) ? puck.previousY : puck.y;
  const segmentX = puck.x - startX;
  const segmentY = puck.y - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared > 0
    ? clamp(((target.x - startX) * segmentX + (target.y - startY) * segmentY) / segmentLengthSquared, 0, 1)
    : 0;
  const closestX = startX + segmentX * projection;
  const closestY = startY + segmentY * projection;
  return Math.hypot(target.x - closestX, target.y - closestY);
}

function collectPocketReleaseSymbolsByTouch(puck) {
  for (let index = state.bonusStars.length - 1; index >= 0; index -= 1) {
    const star = state.bonusStars[index];
    if (star.collected || !star.shouldCollect) continue;
    const hitRadius = state.field.puckRadius + star.radius + 2;
    if (distanceToPuckSegment(puck, star) > hitRadius) continue;
    collectBonusStar(index, puck);
    break;
  }
  collectMultiPlusByTouch(puck, 1);
}

function collectPlannedStars() {
  for (let index = state.bonusStars.length - 1; index >= 0; index -= 1) {
    const star = state.bonusStars[index];
    const puck = state.pucks[star.assignedPuck];
    if (!star.shouldCollect || !puck || puck.purpleBoost || puck.pocketRelease || puck.age < star.collectAfter) {
      continue;
    }
    collectBonusStar(index);
  }
}

function collectMultiPlusByTouch(puck, captureChance = 1, allowUnplanned = false) {
  const token = state.multiPlusToken;
  if (!token || token.collected || (!token.shouldCollect && !allowUnplanned)) return;
  if (token.assignedResultPath && !puck.pocketRelease) return;
  const startX = Number.isFinite(puck.previousX) ? puck.previousX : puck.x;
  const startY = Number.isFinite(puck.previousY) ? puck.previousY : puck.y;
  const segmentX = puck.x - startX;
  const segmentY = puck.y - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared > 0
    ? clamp(((token.x - startX) * segmentX + (token.y - startY) * segmentY) / segmentLengthSquared, 0, 1)
    : 0;
  const closestX = startX + segmentX * projection;
  const closestY = startY + segmentY * projection;
  const hitRadius = state.field.puckRadius + token.radius + 2;
  if ((closestX - token.x) ** 2 + (closestY - token.y) ** 2 <= hitRadius ** 2
    && (captureChance >= 1 || nextPuckRandom(puck) <= captureChance)) {
    collectMultiPlus(puck, true);
  }
}

function upgradeSettledResultToMultiPlus(puck) {
  const result = puck?.result;
  if (!puck?.pocketRelease || puck.authoritativeResult || !result || result.secretRoom || result.multiplier > 0) {
    return false;
  }
  const multiplier = getCellMultiplier(result.col, result.row);
  if (multiplier <= 0 || getCellCategory(result.col, result.row) !== "multi_plus") {
    return false;
  }
  const basePayout = state.activeBetPerPuck * multiplier;
  const x10Boosted = isX10BoostActive();
  const payout = basePayout * (x10Boosted ? 10 : 1);
  result.category = "multi_plus";
  result.multiplier = multiplier;
  result.basePayout = basePayout;
  result.payout = payout;
  result.multiPlusBoosted = true;
  result.x10Boosted = x10Boosted;
  puck.resultRevealStartedAt = performance.now();
  state.bankroll += payout;
  state.roundWinAmount += payout;

  const puckIndex = state.pucks.indexOf(puck);
  let settledCell = state.settledCells.find((cell) => cell.puckIndex === puckIndex);
  if (!settledCell) {
    settledCell = {
      col: result.col,
      row: result.row,
      puckIndex,
      squareWin: true,
      lineWin: false
    };
    state.settledCells.push(settledCell);
  }
  settledCell.squareWin = true;
  settledCell.purpleBoost = x10Boosted;
  playMultiplierResultSound(multiplier, x10Boosted);
  updateBank();
  updateRoundWinLabel();
  startResultRevealAnimation();
  return true;
}

function collectMultiPlus(puck = null, allowUnplanned = false) {
  const token = state.multiPlusToken;
  if (!token || token.collected || (!token.shouldCollect && !allowUnplanned)) return;
  const counterFlyIn = spawnCounterFlyIn(
    "multiPlus",
    toScreen(token.x, token.y),
    getMultiPlusCounterTargetPoint(),
    token.radius
  );
  token.collected = true;
  state.multiPlusActive = true;
  state.multiPlusActivatedAt = performance.now();
  state.pucks
    .filter((item) => item.pocketRelease && item.result)
    .forEach(upgradeSettledResultToMultiPlus);
  state.multiPlusPickupLog = {
    time: Number((puck?.age ?? token.collectAfter ?? 0).toFixed(4)),
    bounce_count: puck?.bounceCount ?? token.pickupBounceCount ?? 0,
    collector_result_path: puck?.authoritativeResult?.result_path || "main"
  };
  updateMultiPlusCounter();
  if (counterFlyIn) {
    counterFlyIn.onComplete = bubbleMultiPlusCounter;
  } else {
    bubbleMultiPlusCounter();
  }
  playMultiPlusSound();
  startResultRevealAnimation();
}

function collectPlannedMultiPlus() {
  const token = state.multiPlusToken;
  if (!token || token.collected || !token.shouldCollect) return;
  const puck = state.pucks[token.assignedPuck];
  if (puck && !puck.purpleBoost && !puck.pocketRelease && puck.age >= token.collectAfter) collectMultiPlus(puck);
}

function resetPucks() {
  if (state.resultRevealFrame !== null) {
    cancelAnimationFrame(state.resultRevealFrame);
    state.resultRevealFrame = null;
  }
  if (state.collectibleIdleFrame !== null) {
    cancelAnimationFrame(state.collectibleIdleFrame);
    state.collectibleIdleFrame = null;
  }
  if (state.counterFlyInFrame !== null) {
    cancelAnimationFrame(state.counterFlyInFrame);
    state.counterFlyInFrame = null;
  }
  state.lastCollectibleIdleRenderAt = 0;
  state.pucks = [];
  state.settledCells = [];
  state.wonLines = [];
  state.bonusStars = [];
  state.multiPlusToken = null;
  state.multiPlusActive = false;
  state.multiPlusPickupLog = null;
  state.multiPlusActivatedAt = 0;
  state.starPickupLog = [];
  state.starBursts = [];
  clearCounterFlyIns();
  state.openSecretZones.clear();
  state.secretZoneOpenTimes = {};
  state.secretRoomLaunchAt = 0;
  state.crownsCollected = 0;
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.running = false;
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.launchButtonPrimed = false;
  state.roundOutcome = null;
  state.fieldPocket = null;
  state.trajectoryPlans = [];
  state.trajectoryDiagnostics = [];
  state.physicsAccumulator = 0;
  state.activeSlot = null;
  state.activeBetPerPuck = 0;
  state.roundWinAmount = 0;
  state.resultSoundStep = 0;
  state.nextMultiplierSoundAt = 0;
  state.nextPocketReleaseIndex = 0;
  updateCrownCounter();
  updateMultiPlusCounter();
  updateRoundWinLabel();
}

function prepareLaunchRound(slot) {
  if (state.running) {
    return false;
  }
  if (state.launchPrepared) {
    return state.launchPreparedSlot === slot;
  }

  setupCanvas();
  const bet = parseBet(slot);
  const count = state.puckCount;
  const totalBet = bet * count;
  if (bet <= 0) {
    return false;
  }

  if (state.bankroll < totalBet) {
    openPopup(els.topUpPopup);
    return false;
  }

  const roundSeed = createRoundSeed();
  const roundOutcome = window.PuckLuckMath?.createRound({
    layoutMode: state.layoutMode,
    risk: state.riskLevel,
    lines: GRID_SIZE,
    pucks: count,
    betPerPuck: bet,
    seed: roundSeed
  }) || null;
  state.fieldPocket = usesFieldPocketMechanics() ? selectRoundFieldPocket(roundOutcome) : null;
  const trajectoryResult = usesFieldPocketMechanics() && !state.fieldPocket
    ? { valid: false, reason: "field_pocket_cell_unavailable", plans: [] }
    : buildTrajectoryPlans(roundOutcome);
  let pocketReleasePlan = { valid: false, reason: "pocket_release_dependencies_unavailable", plans: [] };
  if (roundOutcome && trajectoryResult.valid) {
    try {
      pocketReleasePlan = buildPocketReleaseTrajectoryPlans(roundOutcome);
    } catch (error) {
      pocketReleasePlan = { valid: false, reason: error.message, plans: [] };
    }
  }
  const fixedSymbolPlan = FIXED_BONUS_SYMBOL_LAYOUT && trajectoryResult.valid
    ? buildFixedBonusSymbolPlan(roundOutcome, trajectoryResult.plans)
    : null;
  if (fixedSymbolPlan && !fixedSymbolPlan.valid) {
    roundOutcome.fixed_bonus_fallback_reason = fixedSymbolPlan.reason;
  }
  const starPlan = fixedSymbolPlan?.valid
    ? fixedSymbolPlan
    : trajectoryResult.valid
      ? buildVisualStarPlanLegacy(roundOutcome, trajectoryResult.plans)
      : { valid: false, reason: trajectoryResult.reason };
  const uniqueTrajectoryPlan = roundOutcome && trajectoryResult.valid && starPlan.valid
    ? ensureUniqueRoundTrajectories(roundOutcome, trajectoryResult.plans)
    : { valid: false, reason: "trajectory_uniqueness_dependencies_unavailable" };
  const multiPlusPlan = roundOutcome && trajectoryResult.valid && starPlan.valid && uniqueTrajectoryPlan.valid
    ? buildVisualMultiPlusPlanLegacy(roundOutcome, trajectoryResult.plans)
    : { valid: false, reason: "multi_plus_dependencies_unavailable" };
  let pocketSymbolPlan = { valid: false, reason: "pocket_symbol_dependencies_unavailable" };
  if (roundOutcome && pocketReleasePlan.valid && starPlan.valid && multiPlusPlan.valid) {
    pocketSymbolPlan = assignPlannedSymbolsToPocketRelease(
      roundOutcome,
      pocketReleasePlan,
      trajectoryResult.plans
    );
  }
  if (!roundOutcome || !trajectoryResult.valid || !pocketReleasePlan.valid || !starPlan.valid || !uniqueTrajectoryPlan.valid
    || !pocketSymbolPlan.valid || (roundOutcome?.multi_plus_triggered && !multiPlusPlan.valid)) {
    const reason = trajectoryResult.reason || pocketReleasePlan.reason || starPlan.reason || uniqueTrajectoryPlan.reason
      || multiPlusPlan.reason || pocketSymbolPlan.reason || "authoritative_outcome_unavailable";
    console.error("BalloroX unreachable outcome", {
      reason,
      roundOutcome,
      trajectoryResult,
      starPlan,
      multiPlusPlan,
      pocketSymbolPlan
    });
    els.warningBanner.textContent = `VISUAL PLAN UNAVAILABLE: ${reason}`;
    els.warningBanner.classList.remove("hidden");
    return false;
  }
  els.warningBanner.classList.add("hidden");

  if (state.resultRevealFrame !== null) {
    cancelAnimationFrame(state.resultRevealFrame);
    state.resultRevealFrame = null;
  }
  if (state.collectibleIdleFrame !== null) {
    cancelAnimationFrame(state.collectibleIdleFrame);
    state.collectibleIdleFrame = null;
  }
  if (state.counterFlyInFrame !== null) {
    cancelAnimationFrame(state.counterFlyInFrame);
    state.counterFlyInFrame = null;
  }
  state.lastCollectibleIdleRenderAt = 0;

  state.bankroll -= totalBet;
  state.activeSlot = slot;
  state.activeBetPerPuck = bet;
  state.launchPrepared = true;
  state.launchPreparedSlot = slot;
  state.roundOutcome = roundOutcome;
  state.trajectoryPlans = trajectoryResult.plans;
  state.trajectoryPlans.forEach((plan) => {
    state.recentTrajectoryIds.push(plan.id);
    state.trajectoryUsage[plan.id] = (state.trajectoryUsage[plan.id] || 0) + 1;
  });
  state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
  state.trajectoryDiagnostics = trajectoryResult.plans.map((plan, index) => ({
    puck_index: index,
    target_sector: roundOutcome.puck_results[index].sector,
    target_category: roundOutcome.puck_results[index].category,
    target_multiplier: roundOutcome.puck_results[index].multiplier,
    launch_angle: plan.launch_angle_degrees,
    launch_force: plan.launch_force,
    bounce_count: plan.bounce_count,
    valid: plan.valid,
    final_correction_px: plan.final_correction_px,
    trajectory_id: plan.id,
    duration: plan.duration,
    friction_variant: plan.damping_per_step,
    final_position: plan.landing_point,
    recent_usage_count: plan.recent_usage_count,
    actual_sector: null
  }));
  state.roundWinAmount = 0;
  state.resultSoundStep = 0;
  state.nextMultiplierSoundAt = 0;
  state.nextPocketReleaseIndex = 0;
  state.physicsAccumulator = 0;
  state.pucks = [];
  state.settledCells = [];
  state.wonLines = [];
  state.crownsCollected = 0;
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.multiPlusActive = false;
  state.multiPlusPickupLog = null;
  state.multiPlusActivatedAt = 0;
  state.starPickupLog = [];
  state.starBursts = [];
  clearCounterFlyIns();
  state.openSecretZones.clear();
  state.secretZoneOpenTimes = {};
  state.secretRoomLaunchAt = 0;
  updateRoundWinLabel();
  state.bonusStars = createBonusStars();
  state.multiPlusToken = multiPlusPlan.valid ? createMultiPlusToken() : null;
  updateCrownCounter();
  updateMultiPlusCounter();
  updateBank();
  updateBetButtons();
  render();
  return true;
}

function launchPuck(slot) {
  stopLaunchPrimeAnimation({ rerender: false });
  if (state.running) {
    updateBetButtons();
    return;
  }

  if (!prepareLaunchRound(slot)) {
    return;
  }

  const count = state.roundOutcome?.puck_results?.length || state.puckCount;
  state.running = true;
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.roundId += 1;
  const roundId = state.roundId;
  state.lastFrameAt = performance.now();
  state.physicsAccumulator = 0;
  state.pucks = Array.from({ length: count }, (_, index) => createPuck(index, count, state.roundOutcome.puck_results[index], state.trajectoryPlans[index]));
  playLaunchSound();

  updateBetButtons();
  render();
  requestAnimationFrame((time) => tick(time, roundId));
}

function nudgeVelocity(puck) {
  const jitter = puckRandomBetween(puck, -0.22, 0.22);
  const cos = Math.cos(jitter);
  const sin = Math.sin(jitter);
  const { vx, vy } = puck;
  puck.vx = vx * cos - vy * sin;
  puck.vy = vx * sin + vy * cos;
}

function nextPuckRandom(puck) {
  let value = puck.visualRngState >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  puck.visualRngState = value >>> 0;
  return puck.visualRngState / 4294967296;
}

function puckRandomBetween(puck, min, max) {
  return min + nextPuckRandom(puck) * (max - min);
}

function choosePurpleReturnSector(outcomePlan) {
  const config = getMathConfiguration();
  const seed = (outcomePlan?.visual_seed || state.roundOutcome?.seed || 1) ^ 0x7a4d52b9;
  const rng = window.PuckLuckMath.createRng(seed >>> 0);
  if (outcomePlan?.secret_room_win) {
    const pools = ["center", "middle", "outer"]
      .map((category) => (config?.sector_definitions?.[category] || [])
        .map((sector) => ({ ...sector, category })))
      .find((pool) => pool.length);
    return pools?.[rng.int(pools.length)] || { col: Math.floor(GRID_SIZE / 2), row: Math.floor(GRID_SIZE / 2), category: "center" };
  }
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const empty = (config?.sector_definitions?.empty || [])
    .filter((sector) => sector.index >= 0 && sector.index !== launchIndex);
  return empty.length
    ? { ...empty[rng.int(empty.length)], category: "empty" }
    : { col: 0, row: GRID_SIZE - 1, category: "empty" };
}

function getSectorPoint(sector, rng, marginPx = state.field.puckRadius * 1.35) {
  const { half, grid } = state.field;
  const x0 = -half + sector.col * grid + marginPx;
  const x1 = -half + (sector.col + 1) * grid - marginPx;
  const y0 = -half + sector.row * grid + marginPx;
  const y1 = -half + (sector.row + 1) * grid - marginPx;
  return {
    x: x0 + rng.next() * Math.max(0, x1 - x0),
    y: y0 + rng.next() * Math.max(0, y1 - y0)
  };
}

function randomWallPoint(side, rng, inset) {
  const { half } = state.field;
  const span = half * 2 - inset * 2;
  const value = -half + inset + rng.next() * Math.max(0, span);
  if (side === "top") return { x: value, y: -half + inset };
  if (side === "right") return { x: half - inset, y: value };
  if (side === "bottom") return { x: value, y: half - inset };
  return { x: -half + inset, y: value };
}

const POCKET_RELEASE_TRANSFORMS = Object.freeze({
  top: { sx: -1, sy: -1 },
  right: { sx: 1, sy: -1 },
  bottom: { sx: 1, sy: 1 },
  left: { sx: -1, sy: 1 }
});

function transformReleaseSector(sector, transform) {
  return {
    col: transform.sx < 0 ? GRID_SIZE - 1 - sector.col : sector.col,
    row: transform.sy < 0 ? GRID_SIZE - 1 - sector.row : sector.row
  };
}

function transformReleaseZone(zoneId, transform) {
  const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, zoneId);
  const transformedX = pocket.x * transform.sx;
  const transformedY = pocket.y * transform.sy;
  return SECRET_ZONE_IDS.find((candidateId) => {
    const candidate = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, candidateId);
    return candidate.x === transformedX && candidate.y === transformedY;
  }) || zoneId;
}

function transformReleaseTrajectory(trajectory, transform, result, sourceZoneId) {
  const frames = trajectory.frames.map((frame) => [
    frame[0], frame[1] * transform.sx, frame[2] * transform.sy,
    frame[3] * transform.sx, frame[4] * transform.sy, frame[5]
  ]);
  const bouncePoints = (trajectory.bounce_points || []).map((point) => [
    point[0], point[1] * transform.sx, point[2] * transform.sy, point[3]
  ]);
  const landing = frames.at(-1);
  return {
    ...trajectory,
    id: `release-${sourceZoneId}-${result.result_path || result.visual_seed}-${trajectory.id}`,
    source_descriptor_id: trajectory.id,
    target_sector: { col: result.sector.col, row: result.sector.row },
    target_category: result.category,
    final_sector: { col: result.sector.col, row: result.sector.row },
    landing_point: { x: landing[1], y: landing[2] },
    frames,
    bounce_points: bouncePoints,
    valid: true
  };
}

function selectPocketReleaseTrajectory(result, sourceZoneId, releaseIndex, existingPlans = null) {
  const planner = window.PuckLuckTrajectoryPlanner;
  if (usesFieldPocketMechanics()) {
    const selected = planRuntimeFieldPocketTrajectory({
      result,
      seed: (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0,
      existingPlans: existingPlans
        || state.pucks.map((puck) => puck.replayTrajectory).filter((plan) => plan?.valid),
      startPoint: getFieldPocketNormalized(),
      releaseIndex
    });
    if (!selected) throw new Error(`Field pocket release trajectory is unavailable for ${result.result_path}`);
    state.recentTrajectoryIds.push(selected.id);
    state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
    state.trajectoryUsage[selected.id] = (state.trajectoryUsage[selected.id] || 0) + 1;
    return selected;
  }
  const transform = POCKET_RELEASE_TRANSFORMS[sourceZoneId] || POCKET_RELEASE_TRANSFORMS.bottom;
  let variants;
  if (result.secret_room) {
    const transformedZoneId = transformReleaseZone(result.secret_zone_id, transform);
    variants = window.PuckLuckSecretRoomTrajectories?.library?.[GRID_SIZE]?.entries?.[transformedZoneId] || [];
  } else {
    const transformedSector = transformReleaseSector(result.sector, transform);
    variants = getSafeStandardTrajectoryVariants(GRID_SIZE, `${transformedSector.col}_${transformedSector.row}`);
  }
  if (!variants.length) throw new Error(`Pocket release trajectory is unavailable for ${result.result_path}`);
  const seed = (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0;
  const ordered = [...variants].sort((first, second) =>
    trajectoryChoiceHash(seed, first.id) - trajectoryChoiceHash(seed, second.id)
    || first.id.localeCompare(second.id));
  const conflictPlans = existingPlans
    || state.pucks.map((puck) => puck.replayTrajectory).filter((plan) => plan?.valid);
  let fallback = null;
  for (const descriptor of ordered) {
    let trajectory = planner.hydrateTrajectory(descriptor);
    if (result.secret_room) {
      const captureFrameIndex = Math.max(1, Math.min(
        descriptor.capture_frame_index ?? trajectory.frames.length - 1,
        trajectory.frames.length - 1
      ));
      trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
      trajectory.bounce_points = trajectory.bounce_points.filter((point) => point[0] <= trajectory.frames.at(-1)[0]);
      trajectory.duration = trajectory.frames.at(-1)[0];
      trajectory.bounce_count = trajectory.frames.at(-1)[5];
    }
    const transformed = transformReleaseTrajectory(trajectory, transform, result, sourceZoneId);
    if (!fallback) fallback = transformed;
    if (!trajectoryConflictsWithRound(transformed, conflictPlans, getMathConfiguration()?.puck_radius || 0.1)) {
      fallback = transformed;
      break;
    }
  }
  const selected = fallback;
  if (result.secret_room) {
    const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, result.secret_zone_id);
    const captureRadius = (getMathConfiguration()?.puck_radius || 0.1)
      * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
    const firstFrame = selected.frames[0];
    selected.secret_room = {
      zone_id: result.secret_zone_id,
      entry_id: selected.source_descriptor_id,
      pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
    };
  }
  state.recentTrajectoryIds.push(selected.id);
  state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
  state.trajectoryUsage[selected.id] = (state.trajectoryUsage[selected.id] || 0) + 1;
  return selected;
}

function buildPocketReleaseTrajectoryPlans(roundOutcome) {
  let releaseIndex = 0;
  const allPlans = [];
  const planPocket = (pocketResult) => {
    if (!pocketResult?.secret_room) return;
    const siblingPlans = [];
    (pocketResult.release_results || []).forEach((result) => {
      const trajectory = selectPocketReleaseTrajectory(
        result,
        pocketResult.secret_zone_id,
        releaseIndex,
        siblingPlans
      );
      releaseIndex += 1;
      result.release_trajectory = trajectory;
      siblingPlans.push(trajectory);
      allPlans.push({ result, trajectory, sourceZoneId: pocketResult.secret_zone_id });
      if (result.secret_room) planPocket(result);
    });
  };
  (roundOutcome?.puck_results || []).forEach(planPocket);
  return { valid: true, plans: allPlans };
}

function createPocketReleasePuck(source, zone, releaseIndex, outcomePlan) {
  const releasePuck = {
    ...source,
    visualRngState: (outcomePlan?.visual_seed || (source.visualRngState ^ Math.imul(releaseIndex, 0x9e3779b1))) >>> 0,
    authoritativeResult: normalizeAuthoritativeResult(outcomePlan),
    replayFrame: 0,
    replayCursor: 0,
    replayDelayFrames: 0,
    pocketDepth: 0,
    purpleBoost: false,
    pocketRelease: true,
    stopped: false,
    result: null,
    secretRoom: null
  };
  return releasePuck;
}

function preparePocketReleasePuck(puck, zone, releaseIndex = 0, outcomePlan = null) {
  puck.releaseIndex = releaseIndex;
  puck.authoritativeResult = normalizeAuthoritativeResult(outcomePlan || puck.authoritativeResult);
  const trajectory = puck.authoritativeResult.release_trajectory
    || selectPocketReleaseTrajectory(puck.authoritativeResult, zone.id, releaseIndex);
  puck.replayTrajectory = trajectory;
  puck.replayFrame = 0;
  puck.replayCursor = 0;
  puck.replayDelayFrames = 0;
  puck.pocketRelease = true;
  puck.purpleBoost = false;
  puck.pocketDepth = 0;
  puck.bounceCount = 0;
  puck.secretBounceCount = 0;
  puck.secretRoom = trajectory.secret_room ? {
    zoneId: trajectory.secret_room.zone_id,
    phase: "entry",
    pocketCaptureArmed: Boolean(trajectory.secret_room.pocket_capture_armed),
    roomCursor: 0,
    roomFrame: 0
  } : null;
  const firstFrame = trajectory.frames[0];
  puck.x = firstFrame[1] * state.field.half;
  puck.y = firstFrame[2] * state.field.half;
  puck.vx = firstFrame[3] * state.field.half;
  puck.vy = firstFrame[4] * state.field.half;
  puck.speed = Math.hypot(puck.vx, puck.vy);
  puck.stopped = false;
  puck.result = null;
}

function setSecretRoomPosition(puck, zone, u, v) {
  const point = secretRoomLocalPoint(zone, u, v);
  puck.x = point.x;
  puck.y = point.y;
}

function parkSecretRoomPuck(puck) {
  const visit = puck.secretRoom;
  if (!visit || visit.phase !== "entry") return;
  playPocketDropSound();
  visit.phase = "capturing";
  visit.captureElapsed = 0;
  visit.captureStart = { x: puck.x, y: puck.y };
  visit.preserveEntrySpeed = usesFieldPocketMechanics();
  if (visit.preserveEntrySpeed) {
    const zone = getSecretZoneGeometry(visit.zoneId);
    const captureDistance = Math.hypot(zone.hole.x - puck.x, zone.hole.y - puck.y);
    const entrySpeed = Math.max(0.001, puck.speed);
    visit.captureDuration = Math.max(FIXED_PHYSICS_STEP, captureDistance / entrySpeed);
  } else {
    visit.captureDuration = 0.24;
  }
  if (state.secretRoomLaunchAt < 0) state.secretRoomLaunchAt = 0;
}

function beginSecretRoomVisit(puck) {
  const visit = puck.secretRoom;
  if (!visit || visit.phase !== "pocket_wait") return;
  const zone = getSecretZoneGeometry(visit.zoneId);
  const releaseResults = puck.authoritativeResult?.release_results || [];
  if (releaseResults.length !== 3) {
    throw new Error(`Pocket ${puck.authoritativeResult?.result_path || "unknown"} must release exactly three balls`);
  }
  const releaseStartIndex = state.nextPocketReleaseIndex;
  state.nextPocketReleaseIndex += 3;
  const extraPucks = [1, 2].map((releaseOffset) => {
    const releaseIndex = releaseStartIndex + releaseOffset;
    const releasePuck = createPocketReleasePuck(puck, zone, releaseIndex, releaseResults[releaseOffset]);
    preparePocketReleasePuck(releasePuck, zone, releaseIndex, releaseResults[releaseOffset]);
    return releasePuck;
  });
  preparePocketReleasePuck(puck, zone, releaseStartIndex, releaseResults[0]);
  state.pucks.push(...extraPucks);
  state.openSecretZones.add(visit.zoneId);
  state.secretZoneOpenTimes[visit.zoneId] ||= performance.now();
  playLaunchSound();
}

function stepSecretRoomPuck(puck) {
  const visit = puck.secretRoom;
  if (!visit) return false;
  if (visit.phase === "capturing") {
    const zone = getSecretZoneGeometry(visit.zoneId);
    visit.captureElapsed += FIXED_PHYSICS_STEP;
    const progress = clamp(visit.captureElapsed / visit.captureDuration, 0, 1);
    const eased = visit.preserveEntrySpeed ? progress : progress * progress;
    puck.previousX = puck.x;
    puck.previousY = puck.y;
    puck.x = visit.captureStart.x + (zone.hole.x - visit.captureStart.x) * eased;
    puck.y = visit.captureStart.y + (zone.hole.y - visit.captureStart.y) * eased;
    puck.vx = (puck.x - puck.previousX) / FIXED_PHYSICS_STEP;
    puck.vy = (puck.y - puck.previousY) / FIXED_PHYSICS_STEP;
    puck.speed = Math.hypot(puck.vx, puck.vy);
    puck.pocketDepth = progress * 0.55;
    if (progress >= 1) {
      visit.phase = "pocket_wait";
      puck.x = zone.hole.x;
      puck.y = zone.hole.y;
      puck.vx = 0;
      puck.vy = 0;
      puck.speed = 0;
    }
    return true;
  }
  if (visit.phase === "pocket_wait") return true;
  return false;
}

function getSectorCenter(sector) {
  const { half, grid } = state.field;
  return {
    x: -half + grid * (sector.col + 0.5),
    y: -half + grid * (sector.row + 0.5)
  };
}

function stepReplayPuck(puck) {
  if (puck.stopped) {
    return;
  }
  const frames = puck.replayTrajectory?.frames;
  if (!frames?.length) throw new Error("Puck replay trajectory is missing");
  if (puck.replayDelayFrames > 0) {
    puck.replayDelayFrames -= 1;
    return;
  }
  if (stepSecretRoomPuck(puck)) return;
  const previousBounces = puck.bounceCount;
  const replayProgress = puck.replayCursor / Math.max(1, frames.length - 1);
  const finishBlend = clamp((replayProgress - 0.75) / 0.25, 0, 1);
  const smoothFinishBlend = finishBlend * finishBlend * (3 - 2 * finishBlend);
  const playbackRate = 0.64 + (0.82 - 0.64) * smoothFinishBlend;
  puck.replayCursor = Math.min(puck.replayCursor + playbackRate, frames.length - 1);
  puck.replayFrame = Math.floor(puck.replayCursor);
  const frame = frames[puck.replayFrame];
  const half = state.field.half;
  puck.previousX = puck.x;
  puck.previousY = puck.y;
  puck.age = frame[0];
  puck.x = frame[1] * half;
  puck.y = frame[2] * half;
  puck.vx = frame[3] * half * playbackRate;
  puck.vy = frame[4] * half * playbackRate;
  puck.bounceCount = frame[5];
  puck.speed = Math.hypot(puck.vx, puck.vy);
  if (puck.bounceCount > previousBounces) playWallHitSound(puck.speed);
  if (puck.pocketRelease) collectPocketReleaseSymbolsByTouch(puck);
  if (puck.secretRoom?.phase === "entry") {
    const pocket = getSecretZoneGeometry(puck.secretRoom.zoneId).hole;
    const captureRadius = state.field.puckRadius
      * window.PuckLuckTrajectoryPlanner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
    if (!puck.secretRoom.pocketCaptureArmed) {
      if (Math.hypot(puck.x - pocket.x, puck.y - pocket.y) > captureRadius) {
        puck.secretRoom.pocketCaptureArmed = true;
      }
    } else {
      const captureProgress = window.PuckLuckTrajectoryPlanner.segmentCircleFirstIntersection(
        [0, puck.previousX, puck.previousY],
        [0, puck.x, puck.y],
        pocket,
        captureRadius
      );
      if (captureProgress !== null) {
        puck.x = puck.previousX + (puck.x - puck.previousX) * captureProgress;
        puck.y = puck.previousY + (puck.y - puck.previousY) * captureProgress;
        parkSecretRoomPuck(puck);
        return;
      }
    }
  }
  const finalFrame = frames[frames.length - 1];
  const remainingDistance = Math.hypot(puck.x - finalFrame[1] * half, puck.y - finalFrame[2] * half);
  const actualCell = getCellFromPoint(puck.x, puck.y);
  const target = puck.authoritativeResult;
  const insideTarget = target && actualCell.col === target.col && actualCell.row === target.row;
  const completedBounces = puck.bounceCount >= puck.replayTrajectory.bounce_count;
  const invisibleTail = remainingDistance <= Math.max(2, state.field.puckRadius * 0.12);
  if ((insideTarget && completedBounces && invisibleTail) || puck.replayFrame === frames.length - 1) {
    if (puck.secretRoom?.phase === "entry") parkSecretRoomPuck(puck);
    else settlePuck(puck);
  }
}

function getResultCell(puck) {
  const actual = getCellFromPoint(puck.x, puck.y);
  const actualCategory = getCellCategory(actual.col, actual.row);
  const actualMultiplier = getCellMultiplier(actual.col, actual.row);
  if (puck.authoritativeResult) {
    return { ...puck.authoritativeResult };
  }
  return { col: actual.col, row: actual.row, category: actualCategory, multiplier: actualMultiplier };
}

function getCellCategory(col, row) {
  const config = getMathConfiguration();
  if (isMultiPlusVisualActive()
    && config?.multi_plus?.sectors?.some((sector) => sector.col === col && sector.row === row)) {
    return "multi_plus";
  }
  for (const [category, sectors] of Object.entries(config?.sector_definitions || {})) {
    if (sectors.some((sector) => sector.col === col && sector.row === row)) return category;
  }
  return "unknown";
}

function settleSecretPuck(puck) {
  const actual = getCellFromPoint(puck.x, puck.y);
  const actualCategory = getCellCategory(actual.col, actual.row);
  const multiplier = getCellMultiplier(actual.col, actual.row);
  const diagnostic = state.trajectoryDiagnostics[state.pucks.indexOf(puck)];
  if (diagnostic) {
    diagnostic.actual_sector = actual;
    diagnostic.actual_category = actualCategory;
    diagnostic.visual_matches_target = true;
    const cellLeft = -state.field.half + actual.col * state.field.grid;
    const cellTop = -state.field.half + actual.row * state.field.grid;
    diagnostic.final_position_percent = `${(((puck.x - cellLeft) / state.field.grid) * 100).toFixed(1)}%, ${(((puck.y - cellTop) / state.field.grid) * 100).toFixed(1)}%`;
    const center = getSectorCenter(actual);
    diagnostic.final_distance_to_center_px = Number(Math.hypot(puck.x - center.x, puck.y - center.y).toFixed(2));
  }
  const bonusActive = isX10BoostActive();
  const x10Boosted = bonusActive && multiplier > 0;
  const basePayout = state.activeBetPerPuck * multiplier;
  const payout = basePayout * (x10Boosted ? 10 : 1);
  state.bankroll += payout;
  state.roundWinAmount += payout;
  puck.stopped = true;
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
  puck.secretRoom.phase = "settled";
  puck.pocketRelease = true;
  puck.resultRevealStartedAt = performance.now();
  puck.result = {
    col: actual.col,
    row: actual.row,
    category: actualCategory,
    multiplier,
    payout,
    basePayout,
    x10Boosted,
    secretRoom: false,
    pocketRelease: true,
    secretZoneId: puck.secretRoom.zoneId
  };
  if (multiplier > 0) {
    state.settledCells.push({
      col: actual.col,
      row: actual.row,
      puckIndex: state.pucks.indexOf(puck),
      purpleBoost: x10Boosted,
      squareWin: true,
      lineWin: false
    });
  }
  playMultiplierResultSound(multiplier, x10Boosted);
  if (state.pucks.every((item) => item.stopped)) startResultRevealAnimation();
}

function settlePuck(puck) {
  const result = getResultCell(puck);
  const actual = getCellFromPoint(puck.x, puck.y);
  const diagnostic = state.trajectoryDiagnostics[state.pucks.indexOf(puck)];
  if (diagnostic) {
    diagnostic.actual_sector = actual;
    diagnostic.actual_category = getCellCategory(actual.col, actual.row);
    diagnostic.visual_matches_target = actual.col === result.col && actual.row === result.row;
    const cellLeft = -state.field.half + actual.col * state.field.grid;
    const cellTop = -state.field.half + actual.row * state.field.grid;
    diagnostic.final_position_percent = `${(((puck.x - cellLeft) / state.field.grid) * 100).toFixed(1)}%, ${(((puck.y - cellTop) / state.field.grid) * 100).toFixed(1)}%`;
    const center = getSectorCenter(actual);
    diagnostic.final_distance_to_center_px = Number(Math.hypot(puck.x - center.x, puck.y - center.y).toFixed(2));
  }
  if (actual.col !== result.col || actual.row !== result.row) {
    console.error("BalloroX replay landed in the wrong sector", { expected: result, actual, puck });
  }
  const multiplier = result.multiplier;
  const bonusActive = isX10BoostActive();
  const x10Boosted = bonusActive && !result.secretRoom && multiplier > 0;
  const basePayout = state.activeBetPerPuck * multiplier;
  const payout = basePayout * (x10Boosted ? 10 : 1);
  state.bankroll += payout;
  state.roundWinAmount += payout;
  puck.stopped = true;
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
  puck.resultRevealStartedAt = performance.now();
  puck.result = { ...result, multiplier, payout, basePayout, x10Boosted };
  playMultiplierResultSound(multiplier, x10Boosted);
  state.settledCells.push({
    col: result.col,
    row: result.row,
    puckIndex: state.pucks.indexOf(puck),
    purpleBoost: x10Boosted,
    squareWin: multiplier > 0,
    lineWin: false
  });
  if (state.pucks.every((item) => item.stopped)) startResultRevealAnimation();
}

function settleRound() {
  const effectiveResultMultiplier = (puck) =>
    (puck.result?.multiplier || 0) * (puck.result?.x10Boosted ? 10 : 1);
  const requiredStars = getRequiredStars();
  const authoritativeBonus = state.roundOutcome?.bonus_triggered ?? state.crownsCollected >= requiredStars;
  if (authoritativeBonus && state.roundWinAmount > 0 && !state.crownBonusAwarded) {
    state.x10BoostActivated = true;
    state.pucks.forEach((puck) => upgradeSettledResultToX10(puck, { animate: false, playSound: false }));
    state.crownBonusAwarded = true;
  }
  const roundMultiplier = state.pucks.reduce((total, puck) => total + effectiveResultMultiplier(puck), 0);
  state.wonLines = [];
  if (roundMultiplier > 0) {
    state.resultHistory.unshift({
      value: roundMultiplier,
      baseValue: state.crownBonusAwarded ? roundMultiplier / 10 : roundMultiplier,
      bonus: state.crownBonusAwarded,
      puckCount: state.puckCount
    });
    state.resultHistory = state.resultHistory.slice(0, 60);
  }
  if (roundMultiplier > 0) {
    addPurpleLeaderboardEntry({
      id: `real-${state.roundId}`,
      name: "YOU",
      multiplier: roundMultiplier,
      timestamp: Date.now(),
      isReal: true
    });
  }
  state.running = false;
  state.activeSlot = null;
  state.activeBetPerPuck = 0;
  updateBank();
  updateBetButtons();
  updateRoundWinLabel();
  renderHistory();
  render();
  startCollectibleIdleAnimation();
  scheduleNextAutoPlayRound();
}

function maybeLaunchParkedSecretRooms(now) {
  const parked = state.pucks.filter((puck) => puck.secretRoom?.phase === "pocket_wait");
  if (!parked.length) return;
  const mainFieldStillMoving = state.pucks.some((puck) => !puck.stopped
    && puck.secretRoom?.phase !== "pocket_wait");
  if (mainFieldStillMoving) return;
  if (state.secretRoomLaunchAt === 0) {
    state.secretRoomLaunchAt = now + 1000;
    return;
  }
  if (state.secretRoomLaunchAt > 0 && now >= state.secretRoomLaunchAt) {
    parked.forEach(beginSecretRoomVisit);
    state.secretRoomLaunchAt = -1;
  }
}

function tick(now, roundId) {
  if (!state.running || roundId !== state.roundId) {
    return;
  }

  const frameTime = Math.min(0.1, Math.max(0, (now - state.lastFrameAt) / 1000));
  state.lastFrameAt = now;
  state.physicsAccumulator += frameTime;
  while (state.physicsAccumulator >= FIXED_PHYSICS_STEP) {
    state.pucks.forEach((puck) => {
      stepReplayPuck(puck);
      if (!puck.stopped && !puck.purpleBoost && !puck.pocketRelease) {
        collectBonusStarByTouch(puck);
        collectMultiPlusByTouch(puck);
      }
    });
    collectPlannedStars();
    collectPlannedMultiPlus();
    state.physicsAccumulator -= FIXED_PHYSICS_STEP;
  }
  maybeLaunchParkedSecretRooms(now);
  render();

  if (state.pucks.every((puck) => puck.stopped)) {
    settleRound();
    return;
  }

  requestAnimationFrame((time) => tick(time, roundId));
}

function openPopup(popup) {
  popup.classList.remove("hidden");
  els.menuDropdown.classList.add("hidden");
}

function closePopup(popup) {
  popup.classList.add("hidden");
}

function updateBank() {
  els.bankedLoot.textContent = formatMoney(state.bankroll);
}

function updateRoundWinLabel() {
  if (state.roundWinAmount > 0) {
    els.roundWinLabel.textContent = `${t("win")} ${state.roundWinAmount.toFixed(2)} USD`;
    els.roundWinLabel.classList.remove("hidden");
  } else {
    els.roundWinLabel.textContent = "";
    els.roundWinLabel.classList.add("hidden");
  }
}

function runAutoPlayTick() {
  if (!state.autoPlay || state.running || state.launchPrepared) {
    return;
  }

  const slot = els.betSlots[0];
  if (!slot || parseBet(slot) <= 0) {
    setAutoPlay(false);
    return;
  }

  const totalBet = parseBet(slot) * state.puckCount;
  if (state.bankroll < totalBet) {
    setAutoPlay(false);
    openPopup(els.topUpPopup);
    return;
  }

  launchPuck(slot);
  if (state.autoPlay && !state.running) scheduleNextAutoPlayRound();
}

function scheduleNextAutoPlayRound() {
  if (!state.autoPlay || state.running || state.launchPrepared) return;
  if (state.autoPlayTimer) window.clearTimeout(state.autoPlayTimer);
  state.autoPlayTimer = window.setTimeout(() => {
    state.autoPlayTimer = null;
    runAutoPlayTick();
  }, AUTO_PLAY_ROUND_GAP_MS);
}

function setAutoPlay(enabled) {
  state.autoPlay = enabled;
  els.autoPlayToggle.classList.toggle("active", enabled);
  els.autoPlayToggle.setAttribute("aria-pressed", enabled ? "true" : "false");

  if (state.autoPlayTimer) {
    window.clearTimeout(state.autoPlayTimer);
    state.autoPlayTimer = null;
  }

  if (enabled) {
    if (state.running || state.launchPrepared) return;
    runAutoPlayTick();
  }
}

function fitBrandTitle() {
  if (!els.brandTitle) {
    return;
  }

  const brand = els.brandTitle.closest(".brand");
  const available = brand?.clientWidth || 0;
  if (!available) {
    return;
  }

  const brandBaseSize = 48;
  const brandMaxSize = window.innerWidth <= 390 || window.innerHeight <= 660
    ? 30
    : window.innerWidth <= 720
      ? 34
      : 48;
  els.brandTitle.style.setProperty("--brand-font-size", `${brandBaseSize}px`);
  els.brandTitle.style.width = "max-content";
  const baseWidth = els.brandTitle.scrollWidth;
  const nextSize = Math.max(14, Math.min(brandMaxSize, Math.floor((available / baseWidth) * brandBaseSize)));
  els.brandTitle.style.setProperty("--brand-font-size", `${nextSize}px`);
  els.brandTitle.style.width = "auto";
}

const LOCALIZED_FIT_SELECTOR = [
  ".context-menu [data-i18n]",
  ".purple-leaderboard-title [data-i18n]",
  ".field-options [data-i18n]",
  ".bet-panel [data-i18n]",
  ".live-board-title [data-i18n]",
  ".live-board-head [data-i18n]"
].join(",");

function fitLocalizedUiText() {
  document.querySelectorAll(LOCALIZED_FIT_SELECTOR).forEach((element) => {
    element.classList.add("fit-i18n-text");
    element.style.removeProperty("font-size");
    const available = element.clientWidth;
    if (!available || element.scrollWidth <= available) return;
    const baseSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    const ratio = Math.max(0.7, (available - 2) / element.scrollWidth);
    element.style.fontSize = `${Math.max(7, baseSize * ratio).toFixed(2)}px`;
  });
}

function updateBetButtons() {
  const controlsLocked = state.running || state.launchPrepared;
  els.autoPlayToggle.classList.toggle("active", state.autoPlay);
  els.autoPlayToggle.setAttribute("aria-pressed", state.autoPlay ? "true" : "false");

  els.betSlots.forEach((slot) => {
    const value = parseBet(slot);
    const action = slot.querySelector(".bet-action");
    const input = slot.querySelector(".bet-value");
    const betStepButtons = slot.querySelectorAll(".bet-round-button");
    action.classList.remove("waiting", "cashout", "mining");
    slot.querySelector(".bet-box").classList.toggle("is-locked", controlsLocked);
    input.disabled = controlsLocked;
    betStepButtons.forEach((button) => {
      button.disabled = controlsLocked;
    });

    if (state.running) {
      action.classList.add("waiting");
      action.querySelector("span").textContent = t("wait");
      action.querySelector("small").textContent = t("round");
      return;
    }

    action.querySelector("span").textContent = t("bet");
    action.querySelector("small").textContent = `${formatStake(value * state.puckCount)} USD`;
  });

  els.puckCountButtons.forEach((button) => {
    button.disabled = controlsLocked;
    button.classList.toggle("is-locked", controlsLocked);
  });

  els.gridSizeButtons.forEach((button) => {
    button.disabled = controlsLocked;
    button.classList.toggle("active", Number.parseInt(button.dataset.gridSize, 10) === GRID_SIZE);
  });
  if (els.layoutModeButton) els.layoutModeButton.disabled = controlsLocked;
}

const LAYOUT_BUTTON_LABELS = {
  current: "CUR",
  dynamic_diagonal_width: "DIA",
  plinko_zone_style: "PLK",
  configurator_1: "CFG1",
  configurator_2: "CFG2",
  configurator_3: "CFG3",
  configurator_4: "CFG4",
  configurator_5: "CFG5"
};

function updateLayoutModeButton() {
  const label = window.PuckLuckMath?.LAYOUT_LABELS?.[state.layoutMode] || state.layoutMode;
  if (els.layoutModeButton) {
    els.layoutModeButton.querySelector("span").textContent = LAYOUT_BUTTON_LABELS[state.layoutMode] || "CUR";
    els.layoutModeButton.title = `Layout: ${label}`;
    els.layoutModeButton.setAttribute("aria-label", `Layout: ${label}. Switch multiplier layout`);
  }
}

function cycleLayoutMode() {
  if (state.running || state.launchPrepared || !state.debugPhysics) return;
  const modes = window.PuckLuckMath?.LAYOUT_MODES || ["current"];
  const index = Math.max(0, modes.indexOf(state.layoutMode));
  state.layoutMode = modes[(index + 1) % modes.length];
  resetPucks();
  setupCanvas();
  updateLayoutModeButton();
  updateBetButtons();
  render();
}

function runLockedGameplayTests(rounds) {
  const tester = window.PuckLuckGameplayTest;
  const math = window.PuckLuckMath;
  if (!tester || !math) return [];
  const lineCounts = els.lockTestLines.checked ? [GRID_SIZE] : math.LINE_COUNTS;
  const puckCounts = els.lockTestPucks.checked ? [state.puckCount] : math.PUCK_COUNTS;
  const rows = [];
  for (const lines of lineCounts) for (const pucks of puckCounts) {
    const risk = math.riskForLines(lines);
    rows.push(tester.runGameplayTest({
      math,
      trajectoryLibrary: window.PuckLuckTrajectoryLibrary,
      layoutMode: state.layoutMode,
      risk, lines, pucks, rounds,
      seed: math.hashString(`${state.layoutMode}:${risk}:${lines}:${pucks}:${rounds}`)
    }));
  }
  state.gameplayTestRows = rows;
  const averageHit = rows.reduce((sum, row) => sum + row.hit_frequency, 0) / rows.length;
  els.layoutTestStatus.textContent = `${rows.length} config${rows.length === 1 ? "" : "s"} · ${rounds} rounds · hit ${(averageHit * 100).toFixed(1)}%`;
  return rows;
}

function exportGameplayTestCsv() {
  if (!state.gameplayTestRows.length) runLockedGameplayTests(100);
  const csv = window.PuckLuckGameplayTest.toCsv(state.gameplayTestRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `puck_luck_gameplay_${state.layoutMode}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function canPrimeLaunch(slot) {
  if (state.running || !slot) return false;
  if (state.launchPrepared) return state.launchPreparedSlot === slot;
  const bet = parseBet(slot);
  return bet > 0 && state.bankroll >= bet * state.puckCount;
}

function stopLaunchPrimeAnimation({ rerender = true } = {}) {
  state.launchButtonPrimed = false;
  document.querySelectorAll(".bet-action.is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  if (state.launchPrimeFrame !== null) {
    cancelAnimationFrame(state.launchPrimeFrame);
    state.launchPrimeFrame = null;
  }
  if (rerender && !state.running) {
    render();
  }
}

function animateLaunchPrime() {
  state.launchPrimeFrame = null;
  if (!state.launchButtonPrimed || state.running) {
    return;
  }
  render();
  state.launchPrimeFrame = requestAnimationFrame(animateLaunchPrime);
}

function startLaunchPrimeAnimation() {
  if (state.launchPrimeFrame === null) {
    state.launchPrimeFrame = requestAnimationFrame(animateLaunchPrime);
  }
}

function setupBetControls() {
  els.betSlots.forEach((slot) => {
    const input = slot.querySelector(".bet-value");
    const decrease = slot.querySelector(".decrease-bet");
    const increase = slot.querySelector(".increase-bet");
    const action = slot.querySelector(".bet-action");

    function change(delta) {
      if (state.running || state.launchPrepared) {
        return;
      }
      const current = parseBet(slot);
      input.value = formatStake(getStepValue(current, delta));
      updateBetButtons();
    }

    decrease.addEventListener("click", () => change(-1));
    increase.addEventListener("click", () => change(1));
    input.addEventListener("input", () => {
      if (!state.running && !state.launchPrepared) {
        updateBetButtons();
      }
    });
    input.addEventListener("blur", () => {
      const value = parseBet(slot);
      input.value = value > 0 ? formatStake(value) : "";
      updateBetButtons();
    });
    action.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      if (!canPrimeLaunch(slot)) {
        return;
      }
      if (!prepareLaunchRound(slot)) {
        return;
      }
      action.setPointerCapture?.(event.pointerId);
      state.launchButtonPrimed = true;
      action.classList.add("is-pressed");
      render();
      startLaunchPrimeAnimation();
    });
    action.addEventListener("pointerup", () => launchPuck(slot));
    action.addEventListener("pointercancel", () => launchPuck(slot));
    action.addEventListener("lostpointercapture", () => stopLaunchPrimeAnimation({ rerender: false }));
    action.addEventListener("click", () => launchPuck(slot));
  });

  els.puckCountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.running || state.launchPrepared) {
        return;
      }
      const nextPuckCount = Number.parseInt(button.dataset.puckCount, 10);
      const puckCountChanged = nextPuckCount !== state.puckCount;
      state.puckCount = nextPuckCount;
      els.puckCountButtons.forEach((item) => item.classList.toggle("active", item === button));
      if (puckCountChanged) {
        resetDiamondBoostAfterPuckCountChange();
      } else {
        updateCrownCounter();
      }
      updateBetButtons();
      render();
    });
  });

  els.autoPlayToggle.addEventListener("click", () => {
    setAutoPlay(!state.autoPlay);
  });

  els.gridSizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.running || state.launchPrepared) {
        return;
      }
      GRID_SIZE = Number.parseInt(button.dataset.gridSize, 10);
      state.riskLevel = window.PuckLuckMath?.riskForLines(GRID_SIZE) || "normal";
      setupCanvas();
      resetPucks();
      updateBetButtons();
      render();
    });
  });

}

function setupInteractions() {
  els.layoutModeButton?.addEventListener("click", cycleLayoutMode);
  const toggleTodayWinners = () => {
    state.purpleLeaderboardExpanded = !state.purpleLeaderboardExpanded;
    updatePurpleLeaderboardExpansion();
  };
  els.purpleLeaderboardPanel?.addEventListener("click", toggleTodayWinners);
  els.purpleLeaderboardPanel?.addEventListener("keydown", (event) => {
    if (event.target !== els.purpleLeaderboardPanel || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    toggleTodayWinners();
  });
  els.closeLayoutDevPanel?.addEventListener("click", () => els.layoutDevPanel.classList.add("hidden"));
  els.runLayoutTest100?.addEventListener("click", () => runLockedGameplayTests(100));
  els.runLayoutTest1000?.addEventListener("click", () => runLockedGameplayTests(1000));
  els.exportLayoutTest?.addEventListener("click", exportGameplayTestCsv);

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      cycleLayoutMode();
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      els.layoutDevPanel?.classList.toggle("hidden");
    }
  });

  els.menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    els.menuDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-wrap")) {
      els.menuDropdown.classList.add("hidden");
    }
  });

  els.soundButton.addEventListener("click", () => {
    setAllAudioEnabled(!isAnyAudioEnabled());
  });

  els.menuSoundToggle.addEventListener("change", () => {
    setSoundEffectsEnabled(els.menuSoundToggle.checked);
  });

  els.menuMusicToggle.addEventListener("change", () => {
    setMusicEnabled(els.menuMusicToggle.checked);
  });

  els.menuHapticsToggle.addEventListener("change", () => {
    setHapticsEnabled(els.menuHapticsToggle.checked);
  });

  els.menuAnimationToggle.addEventListener("change", () => {
    setAnimationsEnabled(els.menuAnimationToggle.checked);
  });

  els.menuAvatarButton.addEventListener("click", () => openPopup(els.avatarPopup));
  els.menuLanguageButton.addEventListener("click", () => openPopup(els.languagePopup));
  els.menuRulesButton.addEventListener("click", () => openPopup(els.rulesScreen));
  document.addEventListener("pointerdown", ensureBackgroundMusicAfterGesture, { once: true, passive: true });
  els.closeRulesButton.addEventListener("click", () => closePopup(els.rulesScreen));
  els.closeLanguageButton.addEventListener("click", () => closePopup(els.languagePopup));
  els.closeAvatarButton.addEventListener("click", () => closePopup(els.avatarPopup));
  els.confirmTopUpButton.addEventListener("click", () => {
    const amount = Number.parseFloat(els.topUpAmount.value);
    if (Number.isFinite(amount) && amount > 0) {
      state.bankroll += amount;
      updateBank();
    }
    closePopup(els.topUpPopup);
  });
  els.cancelTopUpButton.addEventListener("click", () => closePopup(els.topUpPopup));

  document.querySelectorAll(".language-options button").forEach((button) => {
    button.addEventListener("click", () => {
      applyLocalization(button.dataset.lang);
      closePopup(els.languagePopup);
    });
  });

  els.historyToggle.addEventListener("click", () => {
    state.historyExpanded = !state.historyExpanded;
    els.historyPanel.classList.toggle("expanded", state.historyExpanded);
    els.historyToggle.setAttribute("aria-expanded", String(state.historyExpanded));
  });

  window.addEventListener("resize", () => {
    setupCanvas();
    fitBrandTitle();
    fitLocalizedUiText();
    resetPucks();
    render();
  });
}

function renderInitialFrame() {
  fitBrandTitle();
  fitLocalizedUiText();
  setupCanvas();
  render();
  document.fonts?.ready.then(() => {
    fitBrandTitle();
    fitLocalizedUiText();
  });
  requestAnimationFrame(() => {
    fitBrandTitle();
    fitLocalizedUiText();
    setupCanvas();
    render();
  });
}

function init() {
  setupCanvas();
  resetPucks();
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguage = (navigator.language || "en").slice(0, 2).toLowerCase();
  const initialLanguage = TRANSLATIONS[storedLanguage] ? storedLanguage : TRANSLATIONS[browserLanguage] ? browserLanguage : "en";
  const soundEffectsEnabled = window.localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) !== "0";
  const animationsEnabled = window.localStorage.getItem(ANIMATIONS_STORAGE_KEY) !== "0";
  const musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) !== "0";
  const hapticsEnabled = window.localStorage.getItem(HAPTICS_STORAGE_KEY) !== "0";
  setSoundEffectsEnabled(soundEffectsEnabled, false);
  setAnimationsEnabled(animationsEnabled, false);
  setMusicEnabled(musicEnabled, false, false);
  setHapticsEnabled(hapticsEnabled, false);
  applyLocalization(initialLanguage, false);
  renderAvatars();
  syncAvatar();
  renderHistory();
  loadTodayWins();
  renderPurpleLeaderboard();
  updatePurpleLeaderboardExpansion();
  setupBetControls();
  setupInteractions();
  updateBetButtons();
  updateLayoutModeButton();
  renderInitialFrame();
}

init();
