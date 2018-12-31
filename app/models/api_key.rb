class ApiKey < ActiveRecord::Base
  belongs_to :user
  validates_presence_of :key
  validates_presence_of :access_type

  ACCESS_TYPE_DISABLED = 0
  ACCESS_TYPE_READ     = 1
  ACCESS_TYPE_WRITE    = 2

  # returns the api_key if found and valid for saving data
  def self.check_valid_key_for_write(key)
    find_by_key_and_access_type(key, ACCESS_TYPE_WRITE)
  end

  # returns the api_key if found and valid for read. Otherwise returns false
  def self.check_valid_key_for_read(key)
    api_key = find_by_key(key)
    return nil if !api_key || api_key.access_type == ACCESS_TYPE_DISABLED
    api_key
  end

  # returns the ApiKey with write access for the given user, or nil if there is none
  def self.find_write_key(user)
    find_by_user_id_and_access_type(user, ACCESS_TYPE_WRITE)
  end

  # returns the ApiKey with write access for the given user, or nil if there is none
  def self.find_read_key(user)
    find_by_user_id_and_access_type(user, ACCESS_TYPE_READ)
  end

  # generate an Api key for a user of specified type
  def self.generate(user, hostname, type = ACCESS_TYPE_READ)
    self.create!(:user => user, :key => Utils.unique_hash, :hostname => hostname, :access_type => type)
  end
end
