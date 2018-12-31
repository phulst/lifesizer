module EmbedHelper
  def add_server_check_option
    current_user.account_option.keep_cache? ? ', serverCheck: true' : ''
  end
end
