# represents a mobile or tablet device. Devices are being added on the fly as new devices
# are detected using the handsetdetection API. This has two benefits:
# 1 - we can store name and other data for the device in the database, and the device identifier
# in a browser cookie. This way, we only need to call the API once for each device.
# 2 - storing device data locally allows us to tweak the PPI (or set a custom name), if the data
# from the API is inaccurate or incomplete.
# PPI is typically calculated from the device resolution, pixel ratio and physical screen size. By storing
# device data in our own database we will be able to fill in the blanks.
class Device < ActiveRecord::Base
  validates :device_id, :uniqueness => true
  validates :vendor, :presence => true
  validates :model, :presence => true

  def self.find_or_create_device(data)
    device = Device.where(:vendor => data[:vendor], :model => data[:model]).first_or_create do |device|
      device.resolution_x = data[:resolution_x]
      device.resolution_y = data[:resolution_y]
      device.device_type  = data[:device_type]
      device.display_size = data[:display_size] if (data[:display_size] && data[:display_size] > 0)
      device.ppi = self.calculate_ppi(data)
      device.device_id = self.make_device_id(data[:vendor], data[:model])
    end
    if (!device.resolution_x || !device.resolution_y || !device.display_size) &&
        data[:resolution_x] && data[:resolution_y] && data[:display_size] && data[:display_size] > 0
      # resolution or display size were missing previously for some reason but are now present
      device.resolution_x = data[:resolution_x]
      device.resolution_y = data[:resolution_y]
      device.display_size = data[:display_size]
      device.ppi = self.calculate_ppi(data) # now we can calculate the ppi
      device.save
    end
    device
  end

  # TODO: this should use a memory cache instead of doing db lookup for every mobile view
  def self.by_device_id(device_id)
    Device.find_by_device_id(device_id)
  end

  # returns the device name, or if not set, the Vendor and Model
  def display_name
    self.device_name || "#{vendor} #{model}"
  end

  # need to have ppi and resolution before we can render images on it.
  def can_render_images_on?
    self.ppi && self.resolution_x && self.resolution_y
  end

  # used as before_create, will automatically create a unique device_id
  def self.make_device_id(vendor, model)
    ven = vendor.downcase.gsub(/[^a-z0-9]/, '')
    mod = model.downcase.gsub(/[^a-z0-9]/, '')
    "#{ven}_#{mod}"
  end

  private

  # calculates PPI with screen size and diameter
  def self.calculate_ppi(data)
    diam = data[:display_size]
    if (data[:resolution_x] && data[:resolution_y] && diam && diam > 0)
      ls = LifeSize.new({ :height => data[:resolution_y], :width => data[:resolution_x]})
      return ls.calc_screen_ppi_with_diameter(diam)
    end
    nil
  end
end
