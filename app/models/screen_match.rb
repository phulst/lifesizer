# copyright 2011 - LifeSizer, Inc.
#
# represents a potential match for a screen type, and its probability
class ScreenMatch
  attr_accessor :screen_info, :confidence

  CONFIDENCE_SCREENRES_UNKNOWN  = 0
  CONFIDENCE_PPI_UNKNOWN        = 10
  CONFIDENCE_VERY_LOW           = 20
  CONFIDENCE_LOW                = 30
  CONFIDENCE_MEDIUM             = 50
  CONFIDENCE_HIGH               = 80
  CONFIDENCE_VERY_HIGH          = 90
  CONFIDENCE_JUST_CALIBRATED    = 100

  # constructor
  def initialize(screen_info, confidence)
    @screen_info = screen_info
    @confidence = confidence
  end

  # used for serialization to javascript object
  def to_js_obj
    {
        # don't need width and height here
        :t => I18n.t(".screen.#{@screen_info.name}") ,
        :n => @screen_info.name,
        :ppi => @screen_info.ppi,
        :type => @screen_info.screen_type,
        :w => @screen_info.width,
        :h => @screen_info.height,
        :c => @confidence
    }
  end
end