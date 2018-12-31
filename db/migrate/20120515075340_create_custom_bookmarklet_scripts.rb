class CreateCustomBookmarkletScripts < ActiveRecord::Migration
  def self.up
    self.create_script('email@host1.com', <<str
function LifeSizerPageParser() {
    this.getTitle = function(elem) {
        // first, look for alt tag of image
        var alt = elem.getAttribute('alt');
        if (alt) {
            return alt;
        }
        // plan B: use title (strip 'Herco - ' at the beginning off)
        var title = document.title;
        var match = /.*\s-\s(.*)/.exec(title);
        return match ? match[1] : title;
    }
    this.getReference = function(elem) {
        var sku = $('#sku');
        return (sku.length > 0) ? sku.text() : _super.getReference();
    }
    this.getThumbnailImgData = function(elem) {
        // don't know width or height
        var url = elem.getAttribute('src');
        return (url) ? { url: url } : null;
    }
    this.getLargeImgData = function(elem) {
        // don't know width or height
        var url = $(elem).parent().attr('href');
        return (url) ? { url: url } : null;
    }
    this.getImages = function() {
        return $('#productdetail #photo a:first img');
    }
    this.enabledDomains = function() {
        return "host1.com";
    }
}
str
    )


    self.create_script('email@host2.com', <<str2
function LifeSizerPageParser() {
    this.getTitle = function(elem) {
        return document.title.split('|')[0].toLowerCase();
    }
    this.getThumbnailImgData = function(elem) {
        // don't know width or height
        var url = elem.getAttribute('rev');
        return (url) ? { url: url } : null;
    }
    this.getLargeImgData = function(elem) {
        // don't know width or height
        var url = elem.getAttribute('href');
        return (url) ? { url: url } : null;
    }
    this.getImages = function() {
        return $('a[rev]');
    }
    this.enabledDomains = function() {
        return "host2.com";
    }
}
str2
  )
  end

  def self.create_script(email, script_content)
    u = User.find_by_email(email)
    if u
      ao = AccountOption.for_user(u)
      if !ao
        ao = AccountOption.create!( :user_id => u.id, :bookmarklet => true, :bookmarklet_options => 1)
      end
      if !ao.custom_bookmarklet
        ao.custom_bookmarklet = CustomBookmarklet.create!( :script => script_content )
        ao.save!
      else
        ao.update_attributes(:script => script_content)
      end
    end
  end

  def self.down
  end
end
