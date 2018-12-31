
require 'tlsmail' #key but not always described
Net::SMTP.enable_tls(OpenSSL::SSL::VERIFY_NONE)
ActionMailer::Base.delivery_method = :smtp
ActionMailer::Base.smtp_settings = {
    :address => "smtp.gmail.com",
    :port => 587,
    :domain => "domain_goes_here",
    :user_name => 'username_goes_here',
    :password => 'password_goes_here', # for security reasons you can use a environment variable too. (ENV['INFO_MAIL_PASS'])
    :authentication => :plain, #or can use "plain"
    :enable_starttls_auto => true
}
