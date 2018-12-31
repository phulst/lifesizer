require 'mobile-fu' # if this is not explicitly set, tests for device detection won't work

class ApplicationController < ActionController::Base
  require 'handset_detection'

  before_filter :theme, :update_user_cookies

  protect_from_forgery
  layout 'main_layout'
  helper :layout

  # cookie that stores all screens and dpi values for current system
  LIFESIZE_COOKIE = "lifesize"
  # cookie with value like "1600x1200" representing current screen resolution
  SCREEN_COOKIE   = "screen"
  # user cookie
  USER_COOKIE = "ls_user"
  LOGGED_IN_COOKIE = "logged_in"

  # default ppi
  PPI_WHEN_UNKNOWN = 120.0

  UNKNOWN_SCREENRES = { :width => -1, :height => -1 }

  def initialize
    @screen_identifier = ScreenMatcher.new
    super # thing will break badly without this!
  end

  # returns true if currently running in production environment
  # warning:this is also defined in ApplicationHelper... fix this
  def prod_env?
    Rails.env.production?
  end

  # redirect for devise after login
  def after_sign_in_path_for(resource)
    stored_location_for(resource) || account_home_path
  end

  # redirects to error page
  def redirect_to_error(msg)
    flash[:notice] = msg
    redirect_to :action => :error, :controller => :show
  end

  # attempts to get the current screen resolution from the request, first by checking
  # h and w parameters, then by checking the 'screen' cookie. Will set the @screen_res
  # hash with :width and :height keys if the screen res could be determined.
  def current_screen_res
    h, w = params[:h], params[:w]
    if h && w
      # found screen resolution in parameters
      @screen_res = { :width => w.to_i, :height => h.to_i }
      set_screenres_cookie(@screen_res) # set it in the cookie
    else
      current_screen = cookies[SCREEN_COOKIE]
      if current_screen
        current_screen.match(/(\d+)x(\d+)/) do |m|
          width = m[1].to_i
          height = m[2].to_i
          @screen_res = {:width => width, :height => height}
        end
      end
    end
    @screen_res = UNKNOWN_SCREENRES if @screen_res.nil?
  end

  # sets a cookie to remember the given screen resolution
  def set_screenres_cookie(screenres)
    cookies[SCREEN_COOKIE] = "#{screenres[:width]}x#{screenres[:height]}"
  end

  # returns a screen_config object, and also initializes the
  # @screen_data object for current (or guessed) screen settings.
  # If the screen data could not determined based on a cookie, it will set the
  # the @screen_matches var, a collection of ScreenIdentifier::ScreenInfo objects
  # with potential matches for the screen. @screen_data will be based on the best
  # match within that array.
  def screen_config
    # if MobileDetection module is used and the current device is mobile, skip this method
    if request.format == :mobile
      #puts "requested from MOBILE device, skipping this"
      return
    end

    # we will need to know the resolution of the current screen, so get that first
    current_screen_res

    config = nil
    if @screen_res != UNKNOWN_SCREENRES
      @screen_matches = @screen_identifier.find_matches(request, @screen_res)
      @screen_data = ScreenData.new(cookies[LIFESIZE_COOKIE])
      config = @screen_data.screen_config(@screen_res[:width], @screen_res[:height])
    else
      @screen_matches = []
    end
    if (config.nil?)
      # couldn't find a matching screen config for the current screen size:
      # See if we can determine it based on request and cookie data
      logger.debug("found #{@screen_matches.length} potential matches for screen")
      if !@screen_matches.empty?
        config = @screen_matches[0].screen_info.to_hash
        config[:confidence] = @screen_matches[0].confidence
      else
        # no best guess either. assume 120.0
        config = { :width => 0, :height => 0,
            :ppi => PPI_WHEN_UNKNOWN, :confidence => ScreenMatch::CONFIDENCE_SCREENRES_UNKNOWN }
        if @screen_res != UNKNOWN_SCREENRES
          config[:width], config[:height] = @screen_res[:width], @screen_res[:height]
          config[:confidence] = ScreenMatch::CONFIDENCE_PPI_UNKNOWN # we know the screen res but nothing more
        end
      end
    else
      # screen config could be read from cookie
      # todo set confidence CONFIDENCE_PREV_CALIBRATED or CONFIDENCE_JUST_CALIBRATED
      # depending on calibration time (for first 2 hours it's CONFIDENCE_JUST_CALIBRATED)
      config[:confidence] = ScreenMatch::CONFIDENCE_VERY_HIGH
    end
    @calibrated = true
    if !config[:confidence] || config[:confidence] < ScreenMatch::CONFIDENCE_VERY_HIGH
      @guessed_config = true # show question marks
      @calibrated = false
    end

    #puts "returning screen config for agent #{request.user_agent}"
    #p config
    @lifesize = LifeSize.new(config)
    @screen_config = config
  end

  # no longer used
  def lifesize
  end

  def authenticate_admin!
    unless admin?
      redirect_to new_user_session_path
    end
  end


  def admin?
    current_user.try(:admin?) || session[:admin]
  end

  def theme
    @theme = Theme.new
  end

  # this needs to be called when including Bookmarklet link from account/_bm_code_js
  # (used in admin_controller and account_controller)
  def set_bookmarklet_vars(user)
    @account_option = user.account_option

    # get api write key for user
    @key = ApiKey.find_write_key(user)

    opt = 0
    # set bit 1 if user has custom bookmarklet
    opt |= 0x01  if @account_option.custom_bookmarklet
    # set bit 2 if local/test environment
    opt |= 0x02 if !prod_env?
    @bookmarklet_options = opt
  end


  private

  # checks if a cookie is present with the user guid. If not, it will set one
  # Will also check if the user is currently logged in. If so, will set a cookie
  # with the email address (used for )
  def update_user_cookies
    guid = cookies[USER_COOKIE] || Guid.new
    domain = ".#{request.domain}" if request.domain != 'localhost'

    cookie_data = { :value => guid, :expires => 5.years.from_now, :http_only => false }
    cookie_data[:domain] = domain if domain
    cookies[USER_COOKIE] = cookie_data
    if (current_user)
      cookie_data =  { :value => current_user.email, :http_only => false }
      cookie_data[:domain] = domain if domain
      cookies[LOGGED_IN_COOKIE] = cookie_data
    else
      # not logged in, delete loggedin cookie
      if domain
        cookies.delete LOGGED_IN_COOKIE, :domain => domain
      else
        cookies.delete LOGGED_IN_COOKIE
      end
    end
  end

  # returns the guid of the current user (as set in cookie)
  def user_guid
    guid = cookies[USER_COOKIE]
  end

  def json_error(msg)
    err = { :error => msg }
    respond_to do |format|
      format.json {
        render :json => err }
    end
  end

  def render_json(json, options={})
    callback, variable = params[:callback], params[:variable]
    response = begin
      if callback && variable
           "var #{variable} = #{json};\n#{callback}(#{variable});"
      elsif variable
           "var #{variable} = #{json};"
      elsif callback
            "#{callback}(#{json});"
      else
        json
      end
    end
    render :json => ({:content_type => :js, :text => response}.merge(options))
  end


  #MOBILE_BROWSERS = ["android", "ipod", "iphone", "opera mini", "blackberry", "palm","hiptop","avantgo","plucker", "xiino","blazer","elaine",
  #                   "windows ce; ppc;", "windows ce; smartphone;","windows ce; iemobile", "up.browser", "ipad",
  #                   "up.link","mmp","symbian","smartphone", "midp", "vodafone","o2","pocket","kindle", "mobile","pda","psp","treo"]
  #IOS_BROWSERS = [ "ipod", "iphone", "ipad"]
  #
  ## returns true if client is any mobile client
  #def is_mobile_client?
  #  request.user_agent.to_s.downcase =~ Regexp.new(MOBILE_BROWSERS.join('|'))
  #end

  # returns true if client is any iOS client (ipad, iphone, ipod)
  #def ios_client?
  #  request.user_agent =~ /(iPad|iPod|iPhone)/   # used to be /(Mobile\/.+Safari)/
  #end
  
  # returns true for request from a Nook or Nexus 7 Android device
  #def android?
  #  request.user_agent =~ /(LogicPD\sZoom2|Nexus\s7)/
  #end

  def not_found
    respond_to do |format|
      format.html { render :file => File.join(Rails.root, 'public', '404'), :status => 404, :layout => false }
      format.json { render :json => { :error => 404 }, :status => 404 }
    end
  end

  # returned when invalid input is received
  def bad_request
    respond_to do |format|
      format.html { render :file => File.join(Rails.root, 'public', '400'), :status => 404, :layout => false }
      format.json { render :json => { :error => 400 }, :status => 400 }
    end
  end

  # For all responses in this controller, return the CORS access control headers.
  def cors_set_access_control_headers
    #headers['Access-Control-Allow-Origin'] = request.headers['Origin'] if request.headers && request.headers['Origin']
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, OPTIONS'
    headers['Access-Control-Max-Age'] = "1728000"
    #headers['Access-Control-Allow-Credentials'] = 'true'
    headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version, Content-Type, Origin, Accept'
  end

  # If this is a preflight OPTIONS request, then short-circuit the
  # request, return only the necessary headers and return an empty
  # text/plain.
  def cors_preflight_check
    if request.method == :options
      #headers['Access-Control-Allow-Origin'] = request.headers['Origin'] if request.headers && request.headers['Origin']
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version, Content-Type, Origin, Accept'
      #headers['Access-Control-Allow-Credentials'] = 'true'
      headers['Access-Control-Max-Age'] = '1728000'
      render :text => '', :content_type => 'text/plain'
    end
  end
end