class Image < ActiveRecord::Base
  attr_accessible :upload, :page_url, :remote_upload_url, :upload_cache, :original_url, :width, :height, :medium_width, :medium_height, :name, :ref, :input_length, :unit, :image_type, :featured, :private, :source, :guid, :old_filename
  attr_accessor :view_url
  belongs_to :user
  has_and_belongs_to_many :user_products, :order => "created_at DESC"
  URL_REGEX = /(((https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/

  mount_uploader :upload, ImageUploader
  AUTO_REF_PREFIX = '_'
  PAGE_SIZE = 50

  TYPE_LS    = 1  # normal lifesize type
  TYPE_CAL   = 2  # calibration image

  UNIT_INCH = 1
  UNIT_CM   = 2
  UNIT_MM   = 3
  UNITS = { 'in' => UNIT_INCH, 'cm' => UNIT_CM, 'mm' => UNIT_MM }

  before_create :set_auto_ref
  before_validation(:on => :create) { create_guid }
  before_validation :check_remote_upload_url

  validates_format_of :remote_upload_url, :with => URL_REGEX, :allow_nil => true, :message => '^The url you provided does not appear to be valid'
  validates_presence_of :user_id
  validates_uniqueness_of :guid
  #validates_presence_of :image_type
  
  validate :either_url_or_file_must_be_provided
  validate :validate_ref
  validate :validate_unique_ref

  validates_integrity_of :upload
  validates_processing_of :upload, :message => '^The file you provided could not be accepted'

  #validates :url, :width, :height, :image_type, :presence => true

  # order by name by default
  # default_scope :order => 'name'
  scope :by_user, lambda { |user_id| where(:user_id => user_id) }
  scope :lifesize_images, where(:image_type => TYPE_LS)
  scope :public_lifesize_images, where(:image_type => TYPE_LS, :private => false)
  scope :featured, where("featured > 0")
  scope :order_by_recent, order("created_at DESC")

  scope :editable_by, lambda { |u|
    if !u.admin?
      where(:user_id => u.id)
    end
  }

  # returns the ppi but defaults to 200 if not set
  def ppi
    self.attributes['ppi'] || 200
  end

  # returns true if ppi is set
  def ppi_not_set?
    self.attributes['ppi'].nil?
  end

  # triggers a validation error if neither url nor file upload are specified
  def either_url_or_file_must_be_provided
    if (!self.remote_upload_url && self.upload.length == 0 && errors[:upload].length == 0)
      errors.add(:base, "You must provide either a url or upload a file")
    end
  end

  def validate_ref
    if has_value?(ref)
      if self.ref.match("^#{AUTO_REF_PREFIX}")
        errors.add(:ref, "^The reference may not begin with a '_' character")
      elsif !self.ref.match /^([\w\-]+)$/
        errors.add(:ref, "^The reference may only contain alphanumeric or characters _ or -")
      end
    end
  end

  # validates that the provided reference doesn't already exist for the curret user
  def validate_unique_ref
    if has_value?(ref)
      img = Image.where(:user_id => self.user_id, :ref => self.ref).first
      errors.add(:ref, "^A reference with this value already exists, please choose a different one") if img && (self.id != img.id)
    end
  end

  def check_remote_upload_url
    if self.remote_upload_url && self.remote_upload_url.length == 0
      self.remote_upload_url = nil
    end
  end

  # returns an image by ref for a given user
  def self.find_user_image_by_ref(user_id, ref)
    if ref.start_with?(AUTO_REF_PREFIX)
      # ref is in format _nnnn, search on auto_ref field
      lifesize_images.by_user(user_id).where(:auto_ref => ref[1..-1].to_s).first
    else
      # ref is custom defined
      lifesize_images.by_user(user_id).where(:ref => ref).first
    end
  end

  # returns an image by url for a given user
  def self.find_lifesize_image_by_url(user_id, image_url)
    lifesize_images.by_user(user_id).where(:original_url => image_url).first
  end

  def self.find_by_guid(guid)
    self.where(:guid => guid).first
  end

  def self.find_user_image_by_guid(user_id, guid)
    self.where(:user_id => user_id, :guid => guid).first
  end

  # returns the most recent image for the user that hasn't been calibrated yet
  def self.find_most_recent_uncalibrated(user_id)
    self.by_user(user_id).where(:ppi => nil).order_by_recent.first
  end

  # returns the n most recently added images
  def self.recent_images(page = 1, per_page = PAGE_SIZE)
    public_lifesize_images.order_by_recent.page(page).per_page(per_page)
  end

  # returns all private and public recently added images
  def self.all_recent_images(page = 1, per_page = PAGE_SIZE)
    lifesize_images.order_by_recent.page(page).per_page(per_page)
  end

  def self.featured_images()
    public_lifesize_images.featured.order_by_recent
    #lifesize_images.order_by_recent # show all for now
  end

  # returns a page of recent user images
  def self.user_images(user_id, page = 1, per_page = PAGE_SIZE)
    lifesize_images.by_user(user_id).order_by_recent.page(page).per_page(per_page)
  end

  # returns the most recent images for a given user
  def self.recent_user_images(user_id, limit = 0)
    if (limit > 0)
      lifesize_images.by_user(user_id).order_by_recent.limit(limit)
    else
      lifesize_images.by_user(user_id).order_by_recent
    end
  end

  # sets the unit from the image edit form
  def unit=(u)
    self.calibrate_unit = UNITS[u] || UNIT_INCH
  end
  def unit
    UNITS.key(self.calibrate_unit || UNIT_INCH)
  end

  # this is the method that should be used by controllers to get the unique reference
  # for an image. Will return the ref set by user, or if not set it will return
  # the auto_ref value
  def image_ref
    has_value?(self.ref) ? self.ref : "#{AUTO_REF_PREFIX}#{self.auto_ref}"
  end

  # sets the input length from the image edit form
  def input_length=(l)
    self.calibrate_length = l.to_f
  end
  def input_length
    self.calibrate_length
  end

  # returns the real life length of the configuration arrow drawn
  def length_in_inches
    case self.calibrate_unit
      when UNIT_CM
        calibrate_length / 2.54
      when UNIT_MM
        calibrate_length / 25.4
      else
        calibrate_length # assume inches
    end
  end

  # stores the arrow start and end coordinates
  def calibrate_data(arrow_start, arrow_end)
    self.calibrate_coords="#{arrow_start}-#{arrow_end}"
  end

  # returns the coordinates of the arrow start
  def arrow_start
    as = nil
    if has_value?(self.calibrate_coords)
      m = self.calibrate_coords.match /^(.*)\-/
      as = m[1] if (m)
    end
    as
  end

  # returns the coordinates of the arrow start
  def arrow_end
    ae = nil
    if has_value?(self.calibrate_coords)
      m = self.calibrate_coords.match /\-(.*)$/
      ae = m[1] if (m)
    end
    ae
  end

  def thumb_url
    self.upload.thumb.url || thumbnail_path
  end

  def medium_url
    self.upload.medium.url
  end

  # returns the file type, ie. 'jpg' or 'png'
  def file_type
    File.extname(upload.file.filename).gsub('.', '').downcase
  end

  # returns the url to the thumbnail for this image
  def thumbnail_path()
    file = "#{THUMBNAIL_BASE}/#{user_id}/#{id}.thmb.jpg"
    puts "checking for existence of #{file}"
    if !File.exists?("#{THUMBNAIL_PATH}#{file}")
      # this shouldn't happen - the thumbnail should be there already
      puts "THUMBNAIL #{id} ISN'T THERE YET "
      begin
        ImageTool.fetch_and_make_thumbnail(self)
      rescue => err
        puts "Unable to fetch image: #{err}"
      end
    end
    file
  end

  # returns the url at which this image can be served.
  def url
    if @view_url
      @view_url # transient view_url can override url from model
    elsif has_value?(self.original_url)
      self.original_url
    else
      self.upload_url
    end
  end

  # create guid before image first validated/saved
  def create_guid
    self.guid = SecureRandom.hex(8) if !self.guid
    self.guid #return guid
  end

  # use the guid in rest controllers
  def to_param
    guid
  end

  # sets the auto ref for this image
  def set_auto_ref
    # get the auto_ref_count value to use
    self.auto_ref = user.next_auto_ref.to_s
  end

  def user_product=(product)
    self.user_products << UserProduct.find_or_create_user_product(self.user_id, product) if !product.blank?
  end

  def user_product
    self.user_products.first
  end

  # returns an object for javascript serialization, only exposing attributes that should be externally
  # visible, and camelizing all keys.
  def js_serialize()
    props = [:name, :page_url, :original_url, :url, :width, :height, :calibrate_coords, :calibrate_unit,
             :calibrate_length, :ppi, :user_id, :auto_ref, :ref]

    img = {}
    props.each do |attr|
      img[attr.to_s.camelize(:lower)] = self.send(attr)
    end
    img[:id] = guid
    # don't include product for now - saves an expensive query
    # img[:product] = self.user_product if self.user_product
    img
  end

  # deprecated
  # returns a json representation of the image, optionally including calibration data
  def to_js_obj(include_calibration_data = false)
    js = {
        :uid => user_id,
        :id => guid,
        :ref => image_ref,
        :w => width,
        :h => height,
        :ppi => ppi.round(2),
        :urls => {
            :t => thumb_url,
            :o => url
        },
        :name => name
    }
    if (include_calibration_data)
      js.merge!(
        :cc => calibrate_coords,
        :cl => calibrate_length,
        :cu => unit
      )
    end
    js
  end

  private

  # returns true if the value is non-nil and not an empty string
  def has_value?(v)
    v && v.length > 0
  end

end
