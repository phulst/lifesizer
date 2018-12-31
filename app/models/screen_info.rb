# copyright 2011 - LifeSizer, Inc.
#
# objects of this class represent known screen configurations (with ppi), that can be detected (or suspected)
# based on client & request information
class ScreenInfo
  attr_accessor :name, :width, :height, :ppi, :screen_type

  @@allScreens = []

  TYPE_MOBILE       = 'mob'
  TYPE_TABLET       = 'tab'
  TYPE_LAPTOP       = 'lap'
  TYPE_DESKTOP      = 'dsk'
  TYPE_PROJECTOR    = 'prj'
  TYPE_UNKNOWN      = 'unk'

  def initialize(name, width, height, ppi, screen_type = TYPE_UNKNOWN)
    @name, @width, @height, @ppi = name, width, height, ppi
    @screen_type = screen_type
    @@allScreens << self
  end

  # returns the current screen info as a hash
  def to_hash
    { :name => @name, :width => @width, :height => @height, :ppi => @ppi, :screen_type => @screen_type}
  end

  # finds a known screen info with given name
  def self.find_by_name(name)
    @@allScreens.each do |si|
      return si if si.name == name
    end
    nil
  end

  # these should match screen.nnn names in resource bundles
  # Most of these specs are from http://en.wikipedia.org/wiki/List_of_displays_by_pixel_density#Apple_Inc.
  SCREEN_IPAD           = ScreenInfo.new("ipad",          1024,  768, 132,  TYPE_TABLET)
  SCREEN_IPHONE         = ScreenInfo.new("iphone",        320,   480, 163,  TYPE_MOBILE)
  SCREEN_IPOD_TOUCH     = ScreenInfo.new("ipod",          320,   480, 163,  TYPE_MOBILE) # display res is half that of native res
  SCREEN_MB_AIR_11      = ScreenInfo.new("mb_air_11",     1366,  768, 135,  TYPE_LAPTOP)
  SCREEN_MB_AIR_13      = ScreenInfo.new("mb_air_13",     1440,  900, 128,  TYPE_LAPTOP)
  SCREEN_MB_13          = ScreenInfo.new("mb_13",         1280,  800, 113,  TYPE_LAPTOP)
  SCREEN_MB_PRO_15      = ScreenInfo.new("mb_pro_15",     1440,  900, 110,  TYPE_LAPTOP)
  SCREEN_MB_PRO_15_HR   = ScreenInfo.new("mb_pro_15_hr",  1680, 1050, 128,  TYPE_LAPTOP)
  SCREEN_MB_PRO_15_RT   = ScreenInfo.new("mb_pro_15_rt",  1920, 1200, 147,  TYPE_LAPTOP)
  SCREEN_MB_PRO_15_RT_MAX=ScreenInfo.new("mb_pro_15_rt",  2880, 1800, 220,  TYPE_LAPTOP)
  SCREEN_MB_PRO_17      = ScreenInfo.new("mb_pro_17",     1680, 1050, 117,  TYPE_LAPTOP)
  SCREEN_MB_PRO_17_HR   = ScreenInfo.new("mb_pro_17_hr",  1920, 1200, 132,  TYPE_LAPTOP)
  SCREEN_IMAC_20        = ScreenInfo.new("imac_20",       1680, 1050, 98.7, TYPE_DESKTOP)
  SCREEN_IMAC_24        = ScreenInfo.new("imac_24",       1920, 1200, 94,   TYPE_DESKTOP)
  SCREEN_IMAC_21        = ScreenInfo.new("imac_21",       1920, 1080, 102,  TYPE_DESKTOP)
  SCREEN_IMAC_27        = ScreenInfo.new("imac_27",       2560, 1440, 109,  TYPE_DESKTOP)
  SCREEN_EXT_27         = ScreenInfo.new("mac_ext_27",    2560, 1440, 109,  TYPE_DESKTOP)
  SCREEN_NOOK_COLOR     = ScreenInfo.new("nook_color",    1024,  600, 169,  TYPE_TABLET) # nook reports screen 800x1223 and window 600x984 though
  SCREEN_NEXUS_7        = ScreenInfo.new("nexus_7",       1200,  800, 144,  TYPE_TABLET) # 216 / 1.5 pixel ratio
  SCREEN_KINDLE_FIRE_HD7= ScreenInfo.new("kindle_fire_hd7",1280, 800, 144,  TYPE_TABLET) # 216 / 1.5 pixel ratio
end
