export function getAuthErrorMessage(error: string | undefined) {
  if (!error) {
    return null
  }

  switch (error) {
    case "AccessDenied":
      return "O acesso com esta conta não foi autorizado."

    case "OAuthSignInError":
    case "OAuthCallbackError":
    case "CallbackRouteError":
      return "Não foi possível concluir o login com o Google. Tente novamente."

    default:
      return "Ocorreu um erro durante o login. Tente novamente."
  }
}
