require 'ezcrypto'
# performs basic encryption to hide cookie data

class Crypt
  @@key = EzCrypto::Key.load(File.join(File.dirname(__FILE__), "ezkey.yml"))

  # encrypts a string
  def self.encrypt(str)
    @@key.encrypt64(str)
  end

  # decrypts a string
  def self.decrypt(str)
    @@key.decrypt64(str).force_encoding('UTF-8')
  end
end