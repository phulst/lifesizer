require 'RMagick'
require 'open-uri'
require 'pathname'

class ImageTool

  # retrieves an image at specified url and stores it in a temporary file,
  # then returns the filename for that file
  def self.retrieve_image(url)
    # if url starts with '/', it''s already local
    if (url[0, 1] == '/')
      return "#{ROOT_PATH}#{url}"
    end

    begin
      filename = "#{TMP_DIR}#{temp_filename}"
      open(url, "User-Agent" => "Ruby/#{RUBY_VERSION}") {|f|

        imgFile = File.new(filename, "wb")
        while (buf = f.read(4096)) do
          imgFile.print(buf)
        end
        imgFile.close
      }
    rescue Exception => err
      raise "Unable to read or save url #{url} #{err}"
    end
    puts("saved url: #{url} to #{filename}")
    filename
  end

  # generates a unique temporary filename
  def self.temp_filename
    "/#{Utils.unique_hash}.jpg"
  end


  def make_thumbnail(rmagick_img, max_width, max_height, user_id, image_id)
    rmagick_img.change_geometry!("#{max_width}x#{max_height}") { |cols, rows, img|
      img.resize!(cols, rows)
    }
    FileUtils.makedirs("#{THUMBNAIL_PATH}/#{user_id}")
    rmagick_img.write() { self.quality = 80 }
  end

  # returns the relative url to the thumbnail
  def self.thumbnail_url(image_id, user_id)
    "#{THUMBNAIL_BASE}/#{user_id}/#{image_id}.thmb.jpg"
  end

  # return the filesystem path for an image thumbnail
  def self.thumbnail_path(image_id, user_id)
    "#{THUMBNAIL_PATH}#{self.thumbnail_url(image_id, user_id)}"
  end

  # fetches the image and returns a hash containing width, height, thumb_width, thumb_height, thumbnail_url.
  # The thumbnail will be stored in a web accessible, but temporary location. If the user is already
  # logged in, use the fetch_and_make_thumbnail method instead.
  def self.fetch_and_make_temp_thumbnail(image_url)
    tmp_img_base = "#{TMP_IMAGE_BASE}#{temp_filename}"
    tmp_img_path = "#{TMP_IMAGE_PATH}#{tmp_img_base}"

    data = fetch_and_resize(image_url, tmp_img_path)
    data[:thumbnail_url] = tmp_img_base
    data
  end

  # saves a thumbnail (in a temporary location) to its permanent location
  def self.save_thumbnail(thumbnail_url, image)
    img_path = "#{TMP_IMAGE_PATH}#{thumbnail_url}"
    # create the dest directory
    FileUtils.makedirs("#{THUMBNAIL_PATH}#{THUMBNAIL_BASE}/#{image.user_id}")
    FileUtils.mv(img_path, self.thumbnail_path(image.id, image.user_id))
    puts "thumbnail moved from #{img_path} to #{self.thumbnail_path(image.id, image.user_id)}"
  end

  # fetches the image url, creates a thumbnail and stores
  # that on the filesystem. This method takes an image object in which at least the image id,
  # the user_id and image url must be set. It will also set the width and height properties
  # on the image. This method is only used if the thumbnail is missing (ie if thumbnail cache
  # was wiped out) and will recreate the thumbnails.
  def self.fetch_and_make_thumbnail(image)
    data = self.fetch_and_resize(image.url, self.thumbnail_path(image.id, image.user_id))
    puts "fetching and making thumbnail for #{image.id}"
    p data
    # image.width, image.height = data[:width], data[:height]
    data[:thumbnail_url] = self.thumbnail_url(image.id, image.user_id)
    data
  end

  # fetches an image, resizes it, saves it and returns info on the image (:width, :height, :thumb_width and :thumb_height)
  # @param image_url  the image object
  # @param filename   the file path to save thumbnail to
  # @param max_width  maximum width of resized image
  # @param max_height maximum height of resized image
  def self.fetch_and_resize(image_url, filename, max_width = 150, max_height = 150)
    image_file = self.retrieve_image(image_url)
    puts "going to read image #{image_file}"
    rmagick_img = Magick::Image.read(image_file).first
    width, height = rmagick_img.columns, rmagick_img.rows

    rmagick_img.change_geometry!("#{max_width}x#{max_height}") { |cols, rows, img|
      img.resize!(cols, rows)
    }

    # remove the full size image if it was passed in as external url
    FileUtils.rm(image_file) if (image_url[0,1] != '/')

    # make sure directory is available to write output
    pn = Pathname.new(filename)
    FileUtils.makedirs(pn.dirname)
    puts "making dirs: #{pn.dirname}"

    # now write output file
    rmagick_img.write(filename) { self.quality = 80 }
    thumb_width, thumb_height = rmagick_img.columns, rmagick_img.rows
    # no longer need the rmagick object
    rmagick_img.destroy!

    { :width => width, :height => height, :thumb_width => thumb_width, :thumb_height => thumb_height }
  end

end