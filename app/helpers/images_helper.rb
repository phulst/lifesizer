module ImagesHelper

  # used by image configure to render lifesize image for calibration. Note that this won't be displayed at
  # actual size. It will generally be displayed at the largest possible size for the current browser window,
  # to make calibration easier
  def lifesize_new_image(image, render_width, render_height, scale, options)
    render_lifesize_image(image.url, image.width, image.height, render_width, render_height, options, scale)
  end

  # returns the url for the next page
  def next_page_url
    current_page = params[:page].try(:to_i) || 1
    if request.path.match /\/page\/(\d+)/
       request.path.gsub(/\/page\/(\d+)$/, "/page/#{current_page+1}")
    else
      "#{request.path}/page/#{current_page+1}"
    end
  end

  def image_source(image)
    if !image.original_url.blank?
      link_to(truncate_middle(image.original_url, 60), image.original_url)
    else
      "uploaded"
    end
  end

  # returns title of image for social sharing (disqus, facebook, etc)
  def social_title(image)
    name = image.name
    if !name.blank?
      name
    elsif domain = product_domain(image)
      "LifeSizer image on #{domain}"
    else
      "LifeSizer image"
    end
  end

  private

  def truncate_middle(str, len)
    if str.length > (len - 3)
      s = len / 2
      str[0,s-2] + "..." + str[-(s-2), (s-2)]
    else
      str
    end
  end
end
