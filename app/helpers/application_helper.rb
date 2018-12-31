module ApplicationHelper

  # new implementaion, that only sets a data-ls-ref and data-ls-uid property
  def lifesize_img(image, options = {})
    sz = @lifesize.image_size(image)
    render_width, render_height = sz[:width], sz[:height]

    opts = {
        :width => render_width,
        :height => render_height,
        :class => 'lifesize',
        :alt => image.name,
        :title => image.name,
        :'data-ls-ref' => image.image_ref,
        :'data-ls-uid' => image.user_id
    }
    image_tag(image.url, opts.merge(options))
  end

  # renders an image at actual lifesize
  def lifesize_image(image, options = {})
    scale = 100 # always assume lifesize, though we may want to make this configurable later
    sz = @lifesize.image_size(image)
    render_width, render_height = sz[:width], sz[:height]

    render_lifesize_image(image.url, image.width, image.height, render_width, render_height, options, scale, image.image_ref)
  end

  # generates an image tag for an image thumbnail
  # :type  :  :medium for medium size thumbnail, :thumb for small thumbnail
  def thumbnail(image, options = {})
    url = (options[:type] == :medium) ? image.medium_url : image.thumb_url
    if (url == image.medium_url && !options[:width])
      # set default width and height for medium thumbnail, if not specified
      options[:width] = ImageUploader::FIXED_WIDTH
      options[:height] = 360
    end
    image_tag(url, ls_image_options(image, options[:width], options[:height], options[:product_images]))
  end

  # renders an image tag (using medium size thumbnail) that fits within a box of given dimensions
  def thumbnail_in_box(image, width, height)
    image_tag(image.medium_url, ls_image_options(image, width, height))
  end

  def current_host
    port = request.port
    host = request.host
    return port.to_i == 80   ? host : "#{host}:#{port}"
  end

  # from an example on http://www.emersonlackey.com/article/rails3-error-messages-for-replacement
  def errors_for(object, message=nil)
    html = ""
    unless object.errors.blank?
      html << "<div class='formErrors #{object.class.name.humanize.downcase}Errors'>\n"
      if message.blank?
        if object.new_record?
          html << "\t\t<h5>There was a problem creating the #{object.class.name.humanize.downcase}</h5>\n"
        else
          html << "\t\t<h5>There was a problem updating the #{object.class.name.humanize.downcase}</h5>\n"
        end
      else
        html << "<h5>#{message}</h5>"
      end
      html << "\t\t<ul>\n"
      object.errors.full_messages.each do |error|
        html << "\t\t\t<li>#{error}</li>\n"
      end
      html << "\t\t</ul>\n"
      html << "\t</div>\n"
    end
    html
  end

  def _set_lifesize(ls)
    @lifesize = ls
  end

  # link for 'contact us'. Currently renders a mailto:link but may later render a link to contact page
  def contact_link(name)
    link_to name, 'mailto:info@lifesizer.com'
  end

  def canonical_url
    # this will not be accurate for the viewer, where query parameters are required

    # don't use url_for, as that will not include the product name for :fullview view
    "#{request.protocol}#{request.host_with_port}#{request.fullpath}"
  end

  def full_image_view_path(image)
    url = "/fview/#{image.guid}"
    # add name for better SEO
    if !image.name.blank?
      url += "/#{image.name.parameterize}"
    end
    url
  end

  private

  # renders the image tag html for lifesize images
  def render_lifesize_image(image_url, image_width, image_height, render_width, render_height, options, scale = 100, ref = '')
    opts = {
        :width => render_width,
        :height => render_height,
        :class => 'lifesize',
        :alt => '',
        #:ref => ref,
        'data-lifesizer' => ls_data(image_width, image_height, render_width, render_height, scale).to_json
    }

    image_tag(image_url, opts.merge(options))
  end

  # constructs an object that is to be stored in the data-lifesizer html5 attribute, containing
  # rendering info for the lifesize object
  def ls_data(width, height, render_width, render_height, scale)
    {
      'ow' => width,
      'oh' => height,
      'lsw' => render_width,
      'lsh' => render_height,
      'scale' => scale
    }
  end

  # return image attributes to set on lifesize image
  # If neither width nor height are set, no attributes will be set for them.
  # If only width is set, the width will be fixed to this and the height will be calculated
  # If both width and height are set, the image width/height attributes will be set to a size that fits within
  # these dimensions, without enlarging the original (medium sized) image
  # if product_images is set to true, it will include the product id in the options
  def ls_image_options(image, width = nil, height = nil, product_images = false)
    size = @lifesize.image_size(image)
    opt = { :class => 'lsview',
      :'data-ls-ref' => image.image_ref,
      # :'data-lifesizer' => raw(ls_data(image.width, image.height, size[:width], size[:height], 100).to_json.gsub('"', "'") ),
      :'data-lifesizer' => (ls_data(image.width, image.height, size[:width], size[:height], 100).to_json ),
      :'data-ls-user' => image.user_id,
      :title => image.name,
      :alt => image.name,
      :border => 0
    }
    if product_images
      # this is an expensive query, so only include when product_images = true
      prod = image.user_product
      opt['data-ls-prod'] = prod.user_product_id if prod
    end

    # if width is set, this will render the medium thumbnail. Calculate the rendered width and height
    if width && height
      # max width and height set
      dims = ScreenUtils.fit_to_box(image.medium_width, image.medium_height, width, height, false)
      opt[:width]  = dims[0].round
      opt[:height] = dims[1].round
    elsif width
      # only width set, calculate height
      opt[:width]  = width
      opt[:height] = ((image.medium_height * width) / image.medium_width).round
    end
    opt
  end

  # extracts and returns the domain name from the image product_url
  def product_domain(image)
    domain = nil
    if !image.page_url.blank?
      # strip off anything after the ? first, as some query strings cause a bad URI exception
      host = image.page_url.split('?')[0]
      full_domain = URI.parse(host).host
      domain = full_domain.downcase.sub(/^(www\.)/, '') if full_domain
    end
    domain
  end

  def warning_icon(image)
    if image.ppi_not_set?
      link_to(image_tag("/img/galleries/warning.png", :size => "16x16", :alt => 'Not calibrated yet', :title => 'Not calibrated yet'), edit_image_path(image))
    end
  end
end