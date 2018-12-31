class AccountController < ApplicationController
  before_filter :authenticate_user!

  def index
  end

  # renders bookmarklet info page
  def bookmarklet
    set_bookmarklet_vars(current_user)
    if @account_option.bookmarklet? && @key
      render :bookmarklet
    else
      render :no_access
    end
  end

  # account home page
  def home
    # set vars for custom bookmarklet link
    @has_custom_bookmarklet = current_user.account_option.bookmarklet?
    if @has_custom_bookmarklet
      @api_key = ApiKey.find_write_key(current_user)
    end

  end

  def no_access
  end
end
