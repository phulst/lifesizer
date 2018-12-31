class OmniauthCallbacksController < Devise::OmniauthCallbacksController

  # callback method called by authenticating service
  def all
    user, just_registered = User.from_omniauth(request.env["omniauth.auth"])
    if user.persisted?
      if just_registered
        # newly registered user
        sign_in user
        redirect_to complete_user_registration_path
      else
        # existing user just logged in again
        flash.notice = "Signed in!"
        sign_in_and_redirect user
      end
    else
      session["devise.user_attributes"] = user.attributes
      redirect_to new_user_registration_url
    end
  end
  alias_method :twitter, :all
  alias_method :facebook, :all
  alias_method :google_oauth2, :all
end
