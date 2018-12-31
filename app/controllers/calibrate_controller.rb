# handles screen calibration save actions, called from LifeSizer viewer.
class CalibrateController < ApplicationController
  before_filter :screen_config, :lifesize

  # asynchronous save after screen calibration
  # input parameters:
  #  img
  #  wc  - total width of calibration image
  #  ws  - render width of calibration image
  #  p   - ppi of calibration image
  #  z   - current browser zoom level
  def save
    cal_img, cal_width, cal_ppi = params[:img], params[:wc].to_i, params[:p].to_f
    ren_width = params[:ws].to_i

    # calculate screen ppi
    @lifesize.calc_screen_ppi_with_calibration_image(cal_ppi, cal_width, ren_width)
    logger.info("calibrated screen with ppi #{@lifesize.ppi}")

    if @screen_data
      cookie = @screen_data.save_screen_config(@screen_res[:width], @screen_res[:height], :ppi => @lifesize.ppi)
      #logger.debug "cookie returned: #{@screen_data.cookie_value.inspect}"
      #puts "encoded: #{cookie.inspect}"

      cookies[LIFESIZE_COOKIE] = cookie
    else
      logger.error("can't calibrate screen, no screen res available");
    end


    data = { :status => 'ok', :ppi => @lifesize.ppi }
    render :json => data
  end


  # asynchronous request to calibrate with a known screen resolution.
  # input parameters:
  #   name
  #   user
  #   ref
  # response data:
  #   lsw
  #   lsh
  #   ppi
  #  or, if an error occurred, status and msg values
  def save_known
    name = params[:name]
    # with the name, we can look up the screen info
    si = ScreenInfo.find_by_name(name)
    data = { :status => 'error' }  # default = error
    if si
      @screen_data = ScreenData.new(cookies[LIFESIZE_COOKIE])
      cookie = @screen_data.save_screen_config(si.width, si.height, { :ppi => si.ppi, :name => si.name} )
      cookies[LIFESIZE_COOKIE] = cookie
      @screen_config = @screen_data.screen_config(si.width, si.height)
      logger.info("saving screen #{name} for user #{user_guid}")

      user, ref = params[:user], params[:ref]
      image = Image.find_user_image_by_ref(user, ref)
      if (image)
        sz = LifeSize.new(@screen_config).image_size(image)
        data = { :status => 'ok', :lsw => sz[:width], :lsh => sz[:height], :ppi => si.ppi}
      else
        data[:msg] = "can't find image for user #{user} and ref #{ref}"
      end

    elsif name
      data[:msg] = "unknown screeninfo: #{name}"
      logger.error("unknown screeninfo: #{name}")
    else
      data[:msg] = "missing parameter 'name'"
      logger.error("missing name parameter in save_known")
    end

    render :json => data
  end
end
