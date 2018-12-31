require 'spec_helper'

describe GoogleSearchHelper do

  context "product image" do
    before :each do
      f = File.new('test/data/google/shopping_results.json')
      google_json = ActiveSupport::JSON.decode(f.readlines.join)
      @products = google_json['items'].collect { |item| WebProduct.from_google(item)}
    end

    it "should create image tag" do

      p = @products[3]
      img = helper.product_image(p, 0)
      doc = Nokogiri::HTML(img)
      doc.css('img').each do |em|
        # width and height are not set for thumbnail images
        em['data-ls-ref'].should == p.ref
        em['class'].should == 'lifesizer-image'
        em['alt'].should == p.name
        em['title'].should == p.name
        em['style'].should == "width:200px;height:auto"
        em['width'].should be_nil
        em['height'].should be_nil
      end
    end
  end
end
