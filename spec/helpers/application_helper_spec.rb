require 'spec_helper'

describe ApplicationHelper do
  before :each do
    assign(:lifesize, LifeSize.new({:width => 1920, :height => 1200, :ppi => 200})) # 2x ppi of image
    @lx5 = create(:lx5_image)
  end

  # parses and tests the data-lifesizer json attribute
  def check_data_lifesizer(em, ow, oh, lsw, lsh, scale = 100)
    data_lifesizer = JSON.parse(em['data-lifesizer'])
    data_lifesizer['ow'].should == 530
    data_lifesizer['oh'].should == 434
    data_lifesizer['lsw'].should == 1060
    data_lifesizer['lsh'].should == 868
    data_lifesizer['scale'].should == scale
  end

  context "life size image" do
    it "should return an image tag" do
      img = helper.lifesize_image(@lx5)
      img.should_not be_nil

      doc = Nokogiri::HTML(img)
      doc.css('img').each do |em|
        # this should be rendered at twice the resolution of the image (530x434) because the screen
        # ppi is 2x image ppi
        em['width'].should == '1060'
        em['height'].should == '868'
        em['class'].should == 'lifesize'
        em['src'].should match(/^http/)

        check_data_lifesizer(em, 530, 434, 1060, 868, 100)
      end
    end
  end

  context "thumbnail image" do
    it "should return a thumbnail image" do
      img = helper.thumbnail(@lx5)
      doc = Nokogiri::HTML(img)
      doc.css('img').each do |em|
        # width and height are not set for thumbnail images
        em['width'].should be_nil
        em['height'].should be_nil
        em['class'].should == 'lsview'
        em['src'].should match(/^\/ls\/(\d)+\/(\d)+\/[0-9a-f]{16}_t\.jpg/)
        em['data-ls-ref'].should == @lx5.image_ref
        em['data-ls-user'].should == @lx5.user.id.to_s

        check_data_lifesizer(em, 530, 434, 1060, 868, 100)
      end
    end
  end

  context "medium thumbnail" do
    it "should return a medium thumbnail image" do
      img = helper.thumbnail(@lx5, :type => :medium)
      doc = Nokogiri::HTML(img)
      doc.css('img').each do |em|
        # width and height are not set for thumbnail images
        em['width'].should == '280'
        em['height'].should == '224'
        em['class'].should == 'lsview'
        em['src'].should match(/^\/ls\/(\d)+\/(\d)+\/[0-9a-f]{16}_m\.jpg/)
        em['data-ls-ref'].should == @lx5.image_ref
        em['data-ls-user'].should == @lx5.user.id.to_s

        check_data_lifesizer(em, 530, 434, 1060, 868, 100)
      end
    end
  end

  it "should render contact link" do
    doc = Nokogiri::HTML(helper.contact_link('my link'))
    doc.css('a').each do |a|
      a['href'].should == 'mailto:info@lifesizer.com'
    end
  end

  it "should extract domain from urls" do
    urls = [{:domain => 'newegg.com', :url => "http://www.newegg.com/Product/Product.aspx?Item=9SIA07W08J2185&nm_mc=OTC-Froogle8&cm_mmc=OTC-Froogle8-_-Watches-_-Citizen-_-9SIA07W08J2185" },
            {:domain => 'michaelkors.com', :url => "http://www.michaelkors.com/p/Michael-Kors-Michael-Kors-Midsized-Chronograph-Watch-Golden-WATCHES/prod2090006/?ecid=MKCIShoppingFeed&ncx=n&uEm=%%CSE%%&ci_src=14110944&ci_sku=prod2090006sku" }]

    img = create(:lx5_image)

    urls.each do |u|
      img.page_url = u[:url]
      helper.send(:product_domain,img).should == u[:domain]
    end
  end
end
