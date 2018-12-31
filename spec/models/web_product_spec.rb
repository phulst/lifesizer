require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe WebProduct do

  before :each do
    @product_data = {"kind"=>"shopping#product",
    "id"=>"tag:google.com,2010:shopping/products/7818/12296150642122519518",
    "selfLink"=>
     "https://www.googleapis.com/shopping/search/v1/public/products/7818/gid/12296150642122519518?alt=json",
    "product"=>
     {"googleId"=>"12296150642122519518",
      "author"=>{"name"=>"Blue Nile", "accountId"=>"7818"},
      "creationTime"=>"2009-10-16T20:31:08.000Z",
      "modificationTime"=>"2011-11-29T15:09:36.000Z",
      "country"=>"US",
      "language"=>"en",
      "title"=>"Key to My Heart Pendant in Sterling Silver",
      "description"=>
       "Give her the key to your heart with this beautiful sterling silver heart-lock and key charm pendant. The petite charms are suspended on a cable chain necklace.",
      "link"=>
       "http://www.bluenile.com/atransfer.jsp?sourceid=12133&goto=http://www.bluenile.com/sterling-silver-key-heart-pendant_6987",
      "brand"=>"Blue Nile",
      "condition"=>"new",
      "inventories"=>
       [{"channel"=>"online",
         "availability"=>"inStock",
         "price"=>92.0,
         "shipping"=>0.0,
         "currency"=>"USD"}],
      "images"=>
       [{"link"=>
          "http://www.bluenile.com/ws/images/single_parameter?image_data=simple-UN21701600-----0-jpg-0"},
        {"link"=>
          "http://www.bluenile.com/ws/images/single_parameter?image_data=simple-UN21701600-----1-jpg-1"}]}}
  end

  it "should create a WebProduct from Google Product result" do
    product = WebProduct.from_google(@product_data)
    product.should_not be_nil
    product.raw_data.should == @product_data
    product.name.should == "Key to My Heart Pendant in Sterling Silver"
    product.ref.should == "7818-12296150642122519518"
    product.description.should == "Give her the key to your heart with this beautiful sterling silver heart-lock and key charm pendant. The petite charms are suspended on a cable chain necklace."
    product.seller.should == "Blue Nile"
    product.product_url.should == "http://www.bluenile.com/atransfer.jsp?sourceid=12133&goto=http://www.bluenile.com/sterling-silver-key-heart-pendant_6987"
    product.image_urls.length.should == 2
    product.image_urls[0].should == "http://www.bluenile.com/ws/images/single_parameter?image_data=simple-UN21701600-----0-jpg-0"
    product.image_urls[1].should == "http://www.bluenile.com/ws/images/single_parameter?image_data=simple-UN21701600-----1-jpg-1"
    product.has_images?.should be_true
  end
end

