class RegistrationsController < Devise::RegistrationsController

  # displayed after registration is complete
  def complete
  end

  protected

  # redirect to registration confirmation page after signup ('complete' action above)
  def after_sign_up_path_for(resource)
    complete_user_registration_path
  end
end