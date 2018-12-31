class TestController < ApplicationController
  layout nil

  # the cookies page will only render with the 'who' parameter right now, like this:
  # /test/cookies?who=peter
  def show_cookies
    if request.post? || params[:who] == 'peter'
      ls = cookies[LIFESIZE_COOKIE]
      if ls
        @cookie_value = JSON.pretty_generate(JSON.parse(Crypt.decrypt(ls)))
      else
        @cookie_value = "lifesize cookie not set"
      end
      @screen_cookie_value = cookies[SCREEN_COOKIE] ? cookies[SCREEN_COOKIE] : "Screen cookie not set"
      render :show_cookies
    else
      render :noaccess
    end
  end

  def delete_lifesize
    cookies.delete(LIFESIZE_COOKIE)
    show_cookies
  end

  def delete_screen
    cookies.delete(SCREEN_COOKIE)
    show_cookies
  end
end
