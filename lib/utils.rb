module Utils

  # returns a unique 16 byte hex hash
  def Utils.unique_hash
    (Digest::MD5.hexdigest "#{Time.now.to_f}#{rand(10000)}")[16,16]
  end

end