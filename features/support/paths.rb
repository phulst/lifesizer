module NavigationHelpers

   # Maps a name to a path. Used by the
   #
   #   When /^I go to (.+)$/ do |page_name|
   #
   # step definition in web_steps.rb
   #
   def path_to(page_name)
     case page_name

       when /the home\s?page/
         root_path
       when /recent images/
         images_recent_path
       when /user images/
         images_user_path
       when /add image/
         new_image_path
       when /(log\s?in|sign\s?in)/
         new_user_session_path
       when /account home/
         account_home_path
       when /registration confirmation/
         complete_user_registration_path
       when /registration/
         new_user_registration_path

       # Add more mappings here.
       # Here is an example that pulls values out of the Regexp:
       #
       #   when /^(.*)'s profile page$/i
       #     user_profile_path(User.find_by_login($1))

       else
         begin
           page_name =~ /the (.*) page/
           path_components = $1.split(/\s+/)
           self.send(path_components.push('path').join('_').to_sym)
         rescue Object => e
           raise "Can't find mapping from \"#{page_name}\" to a path.\n" +
                     "Now, go and add a mapping in #{__FILE__}"
         end
     end
   end
end

World(NavigationHelpers)