
class ApiBaseController < ApplicationController

  # verifies that incoming json request has a valid user and access key
  # this requires a 'key' parameter to have been set
  #
  def json_auth_check_for_write
    k = params[:key]
    if k
      key = ApiKey.check_valid_key_for_write(params[:key])
      @user = key.user if key
    else
      @user = current_user
    end

    if !@user
      resp = { :error => { :msg => 'authentication error', :status => 401 }}
      # it would be appropriate to add :status => :unauthorized here, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
      return false
    end
    true
  end

    # verifies that incoming json request has a valid user and access key
  # this requires a 'key' parameter to have been set
  #
  def json_auth_check_for_read
    k = params[:key]
    if k
      key = ApiKey.check_valid_key_for_read(params[:key])
      @user = key.user if key
    end

    if !@user
      resp = { :error => { :msg => 'authentication error', :status => 401 }}
      # it would be appropriate to add :status => :unauthorized here, but the error callback handlers
      # in jquery won't work properly. So even though this is an authentication error, return status 200.
      render :json => resp, :callback => params[:callback]
      return false
    end
    true
  end

end