        const express = require('express');
        const router = express.Router();
        const auth = require('../../middleware/auth');

        const {check,validationResult} = require('express-validator/check');
        const Profile = require('../../models/Profile');
        const User = require('../../models/User');

        //@route GET api/profile/me
        //@desc Get Current User Profile
        //@acess Private


        router.get('/me',auth, async(req, res) => {
        try{
        const profile = await Profile.findOne({user: req.user.id }).populate('user',
        ['name','avatar']);

        if(!profile)
        {
            res.status(400).json({msg: 'There is no profile for this user'});
        }
        res.json(profile);
        }

        catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
        }
        });


        //@route Post api/profile
        //@desc Create or update a User Profile
        //@acess Private

        router.post('/',[auth, 
            [
            check('status','Status is required')
            .not()
            .isEmpty(),
            check('skills','Skill is required')
            .not()
            .isEmpty()
            ] 
              ],
              async (req,res) => {
                  const errors = validationResult(req);
                  if(!errors.isEmpty()){
                      return res.status(400).json({errors: errors.array()});
                  }

                  const {
                      company,
                      website,
                      location,
                      bio,
                      status,
                      githubusername,
                      skills,
                      youtube,
                      facebook,
                      twitter,
                      instagram,
                      linkedin
                  }= req.body;

 
                  //Build profile object
                  const profileFeilds =  {};
                  profileFeilds.user = req.user.id; 
                  
                
                  if(company) profileFeilds.company = company;
                  if(website) profileFeilds.website = website;
                  if(location) profileFeilds.location = location;
                  if(bio) profileFeilds.bio = bio;
                  if(status) profileFeilds.status = status;
                  if(githubusername) profileFeilds.githubusername = githubusername;
                  if (skills){
                      profileFeilds.skills = skills.split(',').map(skill => skill.trim()); 
                  }
                 
                  
                  //Build Social Object
                  profileFeilds.social={};
                  if(youtube) profileFeilds.social.youtube = youtube;
                  if(twitter) profileFeilds.social.twitter = twitter;
                  if(facebook) profileFeilds.social.facebook = facebook;
                  if(linkedin) profileFeilds.social.linkedin = linkedin; 
                  if(instagram) profileFeilds.social.instagram = instagram;
            
                 
                 try {
                     let profile = await Profile.findOne({user: req.user.id});
                      if(profile){
                         //Update
                         profile = await Profile.findOneAndUpdate(
                             {user: req.user.id},
                             {$set: profileFeilds},
                             {new: true}
                         );
                         return res.json(profile);
                     }
 
                     //Create
                     profile = new  Profile(profileFeilds);
                     await profile.save();
                     return res.json(profile);
                     
                 }
                  catch (error) {
                     console.error(error.message);
                     res.status(500).send('Server Error');
                 }


        });
                          // @route    GET api/profile
                 // @desc     Get all profiles
                // @access   Public
                router.get('/',async(req,res)=> {
                    try {
                        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
                        res.json(profiles);
                    } catch (err) {
                        console.error(err.message);
                        res.status(500).send('Server Error');
                        
                    }
                })


                // @route    GET api/profile/user/:user_id
                // @desc     Get profile by user id
                // @access   Public
                router.get('/user/:user_id',async(req,res)=> {
                    try {
                        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);
                        if (!profile) {
                        return res.status(400).json({ msg: 'Profile not found' });
                        }
                        return res.json(profile);
                      } catch (err) {
                        console.error(err.message);
                        if(err.kind=='ObjectId'){
                        return res.status(400).json({ msg: 'Profile not found' });
                        }
                        return res.status(500).json({ msg: 'Server error' });
                      }
                    }
                  );

                    // @route    DELETE api/profile
                    // @desc     Delete profile, user & posts
                    // @access   Private
                    router.delete('/', auth, async (req, res) => {
                        try {
                        // Remove user posts
                        //await Post.deleteMany({ user: req.user.id });
                        
                        // Remove profile
                        await Profile.findOneAndRemove({ user: req.user.id });
                        // Remove user
                        await User.findOneAndRemove({ _id: req.user.id });
                    
                        res.json({ msg: 'User deleted' });
                        } catch (err) {
                        console.error(err.message);
                        res.status(500).send('Server Error');
                        }
                    });
                    
                        // @route    PUT api/profile/experience
                        // @desc     Add profile experience
                        // @access   Private
                        router.put(
                            '/experience',
                            [
                              auth,
                              [
                                check('title', 'Title is required').not().isEmpty(),
                                check('company', 'Company is required').not().isEmpty(),
                                check('from', 'From date is required and needs to be from the past')
                                  .not()
                                  .isEmpty()
                                  .custom((value, { req }) => (req.body.to ? value < req.body.to : true))
                                  
                              ]
                            ],
                            async (req, res) => {
                              const errors = validationResult(req);
                              if (!errors.isEmpty()) {
                                return res.status(400).json({ errors: errors.array() });
                              }
                          
                              const {
                                title,
                                company,
                                location,
                                from,
                                to,
                                current,
                                description
                              } = req.body;
                          
                              const newExp = {
                                title,
                                company,
                                location,
                                from,
                                to,
                                current,
                                description
                              };
                          
                              try {
                                const profile = await Profile.findOne({ user: req.user.id });
                          
                                profile.experience.unshift(newExp);
                          
                                await profile.save();
                          
                                res.json(profile);
                              } catch (err) {
                                console.error(err.message);
                                res.status(500).send('Server Error');
                              }
                            }
                          );
                         // @route    DELETE api/profile/experience/:exp_id
                        // @desc     Delete experience from profile
                        // @access   Private

                        router.delete('/experience/:exp_id', auth, async (req, res) => {
                            try {
                            const profile = await Profile.findOne({ user: req.user.id });
                        //Get Remove Index
                            const removeIndex = profile.experience
                            .map (item => item.id)
                            .indexOf(req.params.exp_id);

                            profile.experience.splice(removeIndex, 1);
                            await profile.save();
                            res.json(profile);


                            } catch (error) {
                            console.error(error);
                            return res.status(500).json({ msg: 'Server error' });
                            }
                        });
                          // @route    PUT api/profile/education
                         // @desc     Add profile education
                         // @access   Private
                    router.put(
                        '/education',
                        [
                        auth,
                        [
                            check('school', 'School is required').not().isEmpty(),
                            check('degree', 'Degree is required').not().isEmpty(),
                            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
                            check('from', 'From date is required and needs to be from the past')
                            .not()
                            .isEmpty()
                            .custom((value, { req }) => (req.body.to ? value < req.body.to : true))
                        ]
                        ],
                        async (req, res) => {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            return res.status(400).json({ errors: errors.array() });
                        }
                    
                        const {
                            school,
                            degree,
                            fieldofstudy,
                            from,
                            to,
                            current,
                            description
                        } = req.body;
                    
                        const newEdu = {
                            school,
                            degree,
                            fieldofstudy,
                            from,
                            to,
                            current,
                            description
                        };
                    
                        try {
                            const profile = await Profile.findOne({ user: req.user.id });
                    
                            profile.education.unshift(newEdu);
                    
                            await profile.save();
                    
                            res.json(profile);
                        } catch (err) {
                            console.error(err.message);
                            res.status(500).send('Server Error');
                        }
                        }
                    );
                    
                    // @route    DELETE api/profile/education/:edu_id
                    // @desc     Delete education from profile
                    // @access   Private
                    
                    router.delete('/education/:edu_id', auth, async (req, res) => {
                        try {
                        const profile = await Profile.findOne({ user: req.user.id });

                        //Get Remove Index
                        const removeIndex = profile.education
                        .map(item => item.id)
                        .indexOf(req.params.edu_id);

                        profile.education.splice(removeIndex,1);
                        await profile.save();
                        res.json(profile);
                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({ msg: 'Server error' });
                        }
                    });


        module.exports = router;