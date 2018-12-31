# developed for Google products initially. When other sources are going to be supported (ie. Amazon products)
# this should be refactored to be the base class.
#
class WebProduct
  attr_accessor :image_urls, :name, :ref, :description, :product_url, :seller, :raw_data

  # initialize from a Google Products API result
  def self.from_google(data)
    p = self.new
    p.raw_data = data
    p.name = data['product']['title']
    p.ref = "#{data['product']['author']['accountId']}-#{data['product']['googleId']}"
    p.description = data['product']['description']
    p.seller = data['product']['author']['name']
    p.product_url = data['product']['link']

    # set image urls
    p.image_urls = []
    data['product']['images'].each do |img|
      p.image_urls << img['link']
    end
    p
  end

  # returns true if the product has images
  def has_images?
    !@image_urls.empty?
  end
end
