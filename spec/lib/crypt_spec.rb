# coding: utf-8
require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe Crypt do
  it "should decode something small" do
    test_crypt("meow")
  end

  it "should decode something bigger" do
    test_crypt  <<-eos
      Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
      irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
      pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
      deserunt mollit anim id est laborum.
    eos
  end
  
  it "should encrypt/decrypt UTF-8" do
    test_crypt "Kanji:  てすと (te-su-to); Hankaku: ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ"
  end

  # encrypts and decrypts
  def test_crypt(str)
    encoded = Crypt.encrypt(str)
    encoded.should_not be_nil
    decoded = Crypt.decrypt(encoded)
    decoded.should == str
  end
end
