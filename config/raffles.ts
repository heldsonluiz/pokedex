/**
 * Quando ativa, cada vencedor perde todo o saldo atual de tickets ao receber
 * um prêmio. A fotografia usada para auditar o sorteio permanece inalterada.
 */
export const CONSUME_RAFFLE_WINNER_TICKETS = true

/**
 * Cada participante pode gerar uma atualização de perfil e duas movimentações
 * de tickets. Com 100 participantes, o batch permanece abaixo do limite de
 * 500 gravações do Firestore e corresponde ao tamanho máximo de um chunk.
 */
export const RAFFLE_PREPARATION_BATCH_SIZE = 100
