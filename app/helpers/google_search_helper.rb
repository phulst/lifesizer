module GoogleSearchHelper

  def product_image(p, index)
    image_tag(p.image_urls[index], :style => 'width:200px;height:auto', :alt => p.name, :title => p.name, :'data-ls-ref' => p.ref, :class => 'lifesizer-image')
  end
end
