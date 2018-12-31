# encoding: utf-8

# Uploader class for CarrierWave
class ImageUploader < CarrierWave::Uploader::Base
  include CarrierWave::RMagick
  include WithRailsLogger

  FIXED_WIDTH       = 280
  THUMBNAIL_BOX_DIM = 150

  # Choose what kind of storage to use for this uploader:
  storage Settings.cloud_files.enabled ? :fog : :file

  # monkey patch for self.get_content_type to make sure .tif files are saved as jpeg.
  # Macys jpeg files have extension .tif, even though they're jpegs. Fog::Storage
  # sets the file content type based on the extension of the temporary files which
  # ends up being 'image/tiff'. Override that behavior
  module Fog::Storage
    class << self
      def get_content_type(data)
        if data.respond_to?(:path) and !data.path.nil?
          filename = ::File.basename(data.path)
          unless (mime_types = MIME::Types.of(filename)).empty?
            ext = File.extname(filename)
            if ext && ext.downcase == '.tif'
              MIME::Types.type_for("file.jpg").first.content_type
            else
              mime_types.first.content_type
            end
          end
        end
      end
    end
  end

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    # put images in dir by user, with 100 user dirs at the same level
    "#{Settings.uploader.base_dir}/#{(model.user_id / 1000)}/#{model.user_id}"
  end

  # Override to silently ignore trying to remove missing previous file
  def remove!
    begin
      super
    rescue Fog::Storage::Rackspace::NotFound
    end
  end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  # def default_url
  #   "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  # end

  before :cache, :capture_size_before_cache
  #before :retrieve_from_cache, :capture_size_after_retrieve_from_cache

  def capture_size_before_cache(new_file)
    if new_file && new_file.path
      #puts "file is #{new_file.inspect} with path #{new_file.path}"
      w, h = `#{Settings.uploader.identify_path} -format "%wx %h" #{new_file.path}`.split(/x/)
      model.width, model.height = w.strip, h.strip
    end
  end

  def capture_size_after_retrieve_from_cache(cache_name)
    w, h = `#{Settings.uploader.identify_path} -format "%wx %h" #{@file.path}`.split(/x/)
    model.width, model.height = w.strip, h.strip
  end

  # override to fix issue with displaying images from local server during create
  def asset_host
    if model.new_record?
      # this model hasn't been persisted yet. The url will be local so we can use a relative
      # url instead. Carrierwave/fog will by default use the asset_host from the configuration
      # which would point to an invalid /uploads/tmp location on our cloud drive.
      ""
    else
      super
    end
  end

  def dimensions
    "#{model.width}x#{model.height}"
  end

  # Process files as they are uploaded:
  #process :grab_dimensions

  #def grab_dimensions
     # do something
  #end

  def version_filename(filename, ver)
    "#{filename}".sub(/\.([a-z]{3,4})$/, "_#{ver}.\\1")
  end

  # Create different versions of your uploaded files:
  version :thumb do
    process :resize_to_limit => [THUMBNAIL_BOX_DIM, THUMBNAIL_BOX_DIM]
    process :tif_fix

    #process :resize_and_remove_edges => [140, 140]
    def full_filename(for_file = model.upload.file)
      version_filename(for_file, 't')
    end
  end

  # will create a version that will almost always have a width of 280 pixels
  version :medium do
    process :resize_and_remove_edges => [FIXED_WIDTH, 1000, true]
    process :tif_fix
    def full_filename(for_file = model.upload.file)
      version_filename(for_file, 'm')
    end
  end

  def tif_fix
    ext = File.extname(file.filename)
    if ext && ext.downcase == '.tif'
      convert('jpg')
      self.file.content_type = 'image/jpeg'
    end
  end

  def resize_and_remove_edges(width, height, save_dims)
    manipulate! do |img|
      img.fuzz = '1%'
      img.trim!(true)
      # resize to fixed width of 300px
      geometry = Magick::Geometry.new(width, height, 0, 0, Magick::GreaterGeometry)
      new_img = img.change_geometry(geometry) do |new_width, new_height|
        img.resize(new_width, new_height)
      end
      destroy_image(img)
      if save_dims
        logger.info("saving medium size image with resolution #{new_img.columns} x #{new_img.rows}")
        model.medium_height = new_img.rows
        model.medium_width = new_img.columns
      end
      new_img
    end
  end

  # Only accept jpg, jpeg and png files
  # disabled for now, as many external urls do not have a .jpg extension
  #def extension_white_list
  #  %w(jpg jpeg png)
  #end

  def filename
    ext = File.extname(file.filename)
    ext = !ext.blank? ? ext : '.jpg' # default to jpg if no extension found
    @name ||= "#{secure_token}#{ext.downcase}" if original_filename.present?
  end

  private

  def secure_token
    #model.create_guid

    ivar = "@#{mounted_as}_secure_token"
    token = model.instance_variable_get(ivar)
    token ||= model.create_guid

    #token ||= model.instance_variable_set(ivar, SecureRandom.hex(6))
  end
end
