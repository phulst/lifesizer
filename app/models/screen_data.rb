require 'json'

# This class can parse, interpret and update the lifesizer screen data cookies.
#
# A lifesizer screen data cookie with pixel density data for 2 screens may look like this:
# [ {'w' = 1440, 'h' = 900, 'p' = 120.0}, {'w' = 1680, 'h' = 1024, 'p' = 132.0, 'n' = 'mb_pro_15'}  ]
#
# Properties that may be saved for each screen in this cookie:
# w  :  width of screen in pixels
# h  :  height of screen in pixels
# p  :  ppi (pixel density) of screen
# d  :  diamater of screen (in inches)
#
class ScreenData

  # constructor
  # @param cookie_value the encrypted lifesize cookie value
  def initialize(cookie_value)
    #decrypt cookie first
    begin
      decrypted = Crypt.decrypt(cookie_value)
      @screen_data = (cookie_value.nil? || cookie_value.empty?) ? [] : JSON.parse(decrypted)
    rescue
      # probably an old cookie
      @screen_data = []
    end
  end

  # returns the cookie value as a json string
  def cookie_value
    @screen_data.to_json
  end

  # returns the encrypted cookie to set as a hash (containing :value and :expires properties)
  def cookie
    { :value => Crypt.encrypt(cookie_value), :expires => 1.year.from_now }
  end

  # returns the configuration given a current screen resolution, or nil if not found
  def screen_config(width, height)
    @screen_data.each do |c|
      if (c['w'] == width && c['h'] == height)
         return get_config(c)
      end
    end
    nil # none
  end

  # returns the first screen configuration in the cookie. Only use this where we never expect
  # more than 1 screen config to be stored: for mobile devices
  def first_config
    @screen_data.first ? get_config(@screen_data.first) : nil
  end

  # like screen_config, except returns only the :ppi property, or
  # nil if no config found for current screen resolution
  def find_ppi(width, height)
    sc = screen_config(width, height)
    return sc ? sc[:ppi] : nil
  end

  # delete all existing screen configs
  def clear
    @screen_data = []
  end

  # updates a current screen config or saves a new screen config for specified
  # screen resolution and optional additional parameters. Returns the cookie
  def save_screen_config(width, height, params = {})
    cfg = nil
    @screen_data.each do |d|
      if (d['w'] == width && d['h'] == height)
        cfg = d
        break;
      end
    end
    if !cfg
      # add it as a new config
      cfg = { 'w' => width, 'h' => height }
      @screen_data << cfg
      # if there are more than 10 screen resolutions in the array, remove the oldest one
      if @screen_data.length > 10
        @screen_data.shift
      end
    end

    cfg.delete('n') # make sure old name value doesn't stick around
    cfg['p'] = params[:ppi].to_f
    cfg['n'] = params[:name] if params[:name]

    # return the cookie
    cookie
  end

  private

  def get_config(c)
    {:width => c['w'], :height => c['h'], :ppi => c['p'], :name => c['n']}
  end
end
