class ScreenMatcher
  # check for the following devices
  MATCHER_METHODS = [:ipad]

  # calls all matchers in this class and returns an array of ScreenMatch
  # objects for all devices that the request may have possibly come from.
  # ScreenMatch objects in the returned array are in descending order of confidence.
  # If none found, an empty array is returned.
  def find_matches(req, screen_res)
    matches = []
    MATCHER_METHODS.each do |method|
      id = self.send(method, req, screen_res)
      matches << id if id
    end
    matches += match_devices(req, screen_res)
    # sort from high confidence to low confidence
    matches.sort! {|x,y| y.confidence <=> x.confidence }
  end

  # tests for Apple iPad
  def ipad(req, screen_res)
    ipad = ScreenInfo::SCREEN_IPAD
    if user_agent_match(req, /(iPad)/) && resolution_unknown_or(ipad.width, ipad.height, screen_res)
      m = ScreenMatch.new(ScreenInfo::SCREEN_IPAD, ScreenMatch::CONFIDENCE_VERY_HIGH)
    end
    m
  end

  # finds matches for all other known devices using standard approaches, either matching on
  # display resolution or by user agent pattern match.
  def match_devices(req, screen_res)
    matches = []
    [
        { si: ScreenInfo::SCREEN_MB_PRO_15_HR,    conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_MB_PRO_15,       conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_MB_13,           conf: ScreenMatch::CONFIDENCE_HIGH },
        { si: ScreenInfo::SCREEN_MB_PRO_17,       conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_MB_PRO_17_HR,    conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_MB_AIR_11,       conf: ScreenMatch::CONFIDENCE_HIGH },
        { si: ScreenInfo::SCREEN_MB_AIR_13,       conf: ScreenMatch::CONFIDENCE_LOW },

        { si: ScreenInfo::SCREEN_IMAC_20,         conf: ScreenMatch::CONFIDENCE_VERY_LOW },
        { si: ScreenInfo::SCREEN_IMAC_24,         conf: ScreenMatch::CONFIDENCE_LOW },
        { si: ScreenInfo::SCREEN_IMAC_21,         conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_IMAC_27,         conf: ScreenMatch::CONFIDENCE_MEDIUM },
        { si: ScreenInfo::SCREEN_EXT_27,          conf: ScreenMatch::CONFIDENCE_LOW },
        { si: ScreenInfo::SCREEN_MB_PRO_15_RT_MAX,conf: ScreenMatch::CONFIDENCE_HIGH},
        { si: ScreenInfo::SCREEN_MB_PRO_15_RT,    conf: ScreenMatch::CONFIDENCE_MEDIUM},

        { si: ScreenInfo::SCREEN_NOOK_COLOR,      regexp: /LogicPD\sZoom2/, conf: ScreenMatch::CONFIDENCE_VERY_HIGH },
        { si: ScreenInfo::SCREEN_NEXUS_7,         regexp: /Nexus\s7/,       conf: ScreenMatch::CONFIDENCE_VERY_HIGH },
        { si: ScreenInfo::SCREEN_IPOD_TOUCH,      regexp: /(iPod)/,         conf: ScreenMatch::CONFIDENCE_VERY_HIGH },
        { si: ScreenInfo::SCREEN_IPHONE,          regexp: /(iPhone)/,       conf: ScreenMatch::CONFIDENCE_VERY_HIGH },
        { si: ScreenInfo::SCREEN_KINDLE_FIRE_HD7, regexp: /(KFTT.*Silk)/,   conf: ScreenMatch::CONFIDENCE_VERY_HIGH }
    ].each do |scr|
      match = false
      si, regexp = scr[:si], scr[:regexp]
      if regexp
        # match by regular expression on user agent
        match = user_agent_match(req, regexp)
      elsif mac?(req)
        # match by screen resolution. All devices that can match by screen resolution are mac devices
        match = resolution_is?(si.width, si.height, screen_res)
      end
      matches << ScreenMatch.new(si, scr[:conf]) if match
    end
    matches
  end

  private

  # returns true if the request came from a mac
  def mac?(req)
    user_agent_match(req, /(Macintosh)/)
  end

  # returns true if the user agent was set and matches a given pattern
  def user_agent_match(req, pattern)
    req.user_agent && req.user_agent[pattern]
  end

  # return true if the screen resolution cookie is set and matches the given resolution
  def resolution_is?(width, height, screen_res)
    screen_res && dimension_match(width, height, screen_res)
  end

  # returns true if the screen resolution is either unknown, or matches a given resolution.
  def resolution_unknown_or(width, height, screen_res)
    return screen_res.nil? || dimension_match(width, height, screen_res)
  end

  # returns true if dimensions passed in match that of screen_res, either directly or with flipped orientation
  def dimension_match(width, height, screen_res)
    return ((screen_res[:width] == width && screen_res[:height] == height) || (screen_res[:width] == height && screen_res[:height] == width))
  end
end
