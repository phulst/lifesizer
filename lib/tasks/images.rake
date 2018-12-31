
namespace :images do

  desc "recreate all image thumbnails"
  task :recreate_old => :environment do
    puts "recreating all thumbnails"
    Image.all.each do |image|
      #puts image.inspect

      iu = ImageUploader.new

      filename = image.upload.file.file
      if File.exist?(filename)
        puts "#{filename} already exists"
        image.upload.recreate_versions!
        image.save!
      else
        puts "#{filename} doesn't exist"
        if image.original_url && !image.original_url.blank? && image.original_url !~ /^\//
          image.remote_upload_url = image.original_url
          image.upload.recreate_versions!
          image.save!
        else
          puts "image #{image.upload} has no original url, can't recreate"
        end
      end
    end
  end

  desc "move files to CloudFiles"
  task :movecloudfiles => :environment do
    puts "copying all files to cloudfiles"
    cnt = 0
    # do featured images first, then all others starting with most recent
    Image.order('featured, created_at desc').each do |image|
      if !image.old_filename
        # only do this if old_filename hasn't been set yet
        old_name = image.upload.file.filename
        begin
          path = "#{Rails.root}/public/#{Settings.uploader.root_dir}/0/#{image.user_id}/#{old_name}"
          if File.exist?(path)
            image.old_filename = old_name
            image.save(:validate => false) # skip validations
            image.upload = File.open(path)
            image.save!
            puts "#{cnt}: uploaded images for #{image.guid} for user #{image.user_id}"
          else
            puts "file does not exist: #{path}"
          end
        rescue => err
          puts err.inspect
          puts err.backtrace
          puts "error storing image #{image.id} at path #{path}"
        end
      end
      cnt += 1
    end
  end

  desc "fix gdgt images"
  task :fix_gdgt => :environment do
    puts "fixing gdgt images"
    Image.where(:user_id => 614).each do |img|
      puts "found image: #{img.ref} with url #{img.original_url}"
      if !img.user_product
        # no user product yet
        m = /.*\/(.*)\.jpg/.match(img.original_url)
        if m
          new_ref = m[1]
          puts "for image #{img.original_url} set reference to #{new_ref} and product #{img.ref}"
          img.user_product = img.ref
          img.ref = new_ref
          img.save!
        else
          puts 'cannot extract new ref from url #{img.original_url}'
        end
      end
    end
  end

  desc "recreate image from local copy"
  task :recreate_local, [:guids] => :environment do |t, args|
    guid = args.guids
    puts "processing image #{guid}"
    image = Image.find_by_guid(guid)
    path = "#{Rails.root}/public/#{Settings.uploader.root_dir}/0/#{image.user_id}/#{image.old_filename}"
    if File.exists?(path)
      puts "uploading image #{guid} for user #{image.user_id} to CloudFiles"
      image.upload = File.open(path)
      image.save!
    else
      puts "no local file exists for image #{guid} at path #{path}"
    end
  end

  task :fix_staging => :environment do
    ids = %w(b24caf8e25def9e8
    9c5eacc1dd121fb4
    5428fb2e8e69e8af
    8ec613bc7548f927
    250068c1f67c71e2
    2571b19703eb65ad
    dd610c8336427345
    a7af51846f60d698
    07e84b7bd49512a2
    89c2d5b804840483
    ae9f4f7e59da107e
    56b3c5a513afc473
    d7cef8148623a9b6
    5ebdc2d8d71fc4a5
    131896881f68482b
    e861fcdd0b96b0c3
    8f624aceb0955539
    264ae2c82f56803d
    5ac23fa91f83dead
    662bcae391409569
    eaf2317f1bee97ca
    8ec6a1824f6ff823
    af95a1d719ff0cce
    1cf101ade87c38ff
    8501997bffcaaba6
    410477e9ea651693
    a10142dd3abb7ec8
    2b37c6694c80d27d
    c8444db8451c4ec6
    )

    ids.each do |id|
      Rake::Task['images:recreate_local'].reenable
      Rake::Task['images:recreate_local'].invoke(id)
    end
  end
end