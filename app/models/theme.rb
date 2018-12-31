class Theme

  attr_reader :light_color, :accent_1, :accent_2, :dark_color, :bright_color, :error_msg_color, :image_bg_color

  def initialize
    #@light_color = '#fff8e3'
    @light_color = '#ffffff'
    @accent_1 = '#cccc9f'
    #@accent_2 = '#9fb4cc'
    @accent_2 = '#7aace5'
    @dark_color = '#2b2b2b'
    @bright_color = '#db4105'
    @error_msg_color = '#ff0000'
    @image_bg_color = '#ffffff'
  end

end