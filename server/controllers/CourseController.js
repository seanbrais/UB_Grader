import User from '../models/User'
import Course from '../models/Course'
import * as AuthCheck from '../util/authentication'

/**
 * Gets the courses for user depending on access level.
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends a list of courses back as the response (a list of json objects)
 */
export function getCourses(req, res) {

    var sys_role = AuthCheck.getAccessLevel(req, res);
    if (sys_role) {

        if (sys_role === 'admin') {

            Course.find({}, (err, allCourses) => {
                if (err){
                    res.status(500).send(err);
                }
                else {  
                    var courses = [];                
                    for (var i=0; i<allCourses.length; i++) {
                        courses.push({
                            id:             allCourses[i].id,
                            course_num:     allCourses[i].course_num,
                            display_name:   allCourses[i].display_name,
                            semester:       allCourses[i].semester
                        });
                    }
                    res.status(200).send(courses); 
                }            
            });            
        }
    }

    else{

        var courselist = [];

        Course.find({}, (err, courses) => {
            if (err) {
                res.status(500).send(err);
            }
            else {          
                req.user.courses.forEach((course) => {
                    courses.forEach((courseobj) => {
                        if (course.course_id == courseobj.id){
                            courselist.push({
                                id:                 courseobj.id,
                                course_num:         courseobj.course_num,
                                display_name:       courseobj.display_name,
                                semester:           courseobj.semester
                            });
                        }
                    });
                });
                res.status(200).send(courselist);
            }
        });
    }
}

/**
 * Gets all the assignments of a specific course.
 * @param req : User's request (should contain course_id as a parameter)
 * @param res : The response back to the caller.
 * Sends a list of the assignments back as the response (a list of json objects)
 */

export function getAssignments(req, res){
    Course.findOne({ 'course_num': req.params.course_num }, (err, course) => {
        if (err) res.status(500).send(err);                    
        else res.status(200).send(course.assignments);
    });
}


/**
 * Gets all the students of a specific course.
 * @param req : User's request (should contain course_id as a parameter)
 * @param res : The response back to the caller.
 * Sends a list of the students back as the response (a list of json objects)
 */

export function getStudents(req, res){
    var studentList = [];
    User.find({}, (err, users) => {
        if (err) {
            res.status(500).send(err); 
        }
        else {          
            users.forEach((user) => {
                user.courses.forEach((course) => {
                    if (course.course_num == req.params.course_num && course.course_role == 'Student'){
                        studentList.push(user);
                    }
                });
            });
            res.status(200).send(studentList);
        }
    });
}


/**
 * Gets all the sections of a specific course.
 * @param req : User's request (should contain course_id as a parameter)
 * @param res : The response back to the caller.
 * Sends a list of the sections back as the response (a list of json objects)
 */

export function getSections(req, res){
    var sectionList = [];
    Course.findOne({ 'course_num': req.params.course_num }, (err,course) =>{
        if (err) res.status(500).send(err);                    
        else res.status(200).send(course.sections);
    })
}


/**
 * Gets all the students of a specific section of a course.
 * @param req : User's request (should contain course_id and section_name as a parameter)
 * @param res : The response back to the caller.
 * Sends a list of the students back as the response (a list of json objects)
 */

export function getSectionStudents(req, res){
    var studentList = [];
    User.find({}, (err, users) => {
        if (err) {
            res.status(500).send(err);
        }
        else {           
            users.forEach((user) => {
                user.courses.forEach((course) => {
                    if (course.course_num == req.params.course_num && course.section_name == req.params.section_name && course.course_role == 'Student'){
                        studentList.push(user);
                    }
                });
            });
            res.status(200).send(studentList);
        } 
    });
}

/**
 * Creates a new course.
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends back a JSON object of the created course.
 */

export function createCourse(req, res){
    // var sys_role = AuthCheck.getAccessLevel(req, res);
    // if (sys_role === 'admin'){
    var course = new Course(req.body);        
    course.save((err, courseobj) => {
        if (err) res.status(500).send(err);
        else res.status(200).send(courseobj);
    });
    // }
}


/**
 * Updates an existing course.
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends back a JSON object of the updated course.
 */
export function updateCourse(req, res){
    // var sys_role = AuthCheck.getAccessLevel(req, res);
    // if (sys_role === 'admin'){
    Course.findOne({ 'course_num': req.params.course_num }, (err,courseobj) =>{
        if (err) res.status(500).send(err); 
        // for (var key in req.body){
        //     courseobj.key = req.body[key];
        //     console.log(courseobj.key);
        //     console.log(req.body.key);
        //     console.log(req.body[key]);
        //     console.log(courseobj[key]);
        //     console.log('-----------');
        // }
        else {
            if (req.body.display_name){
                courseobj.display_name = req.body.display_name;
            }
            if (req.body.semester){
                courseobj.semester = req.body.semester;
            }                   
            if (req.body.sections){
                courseobj.sections = req.body.sections;
            }
            courseobj.save((err, updatedcourseobj) => {
                if (err) res.status(500).send(err);
                else res.status(200).send(updatedcourseobj);
            });
        }
    });

    //}
}

/**
 * Adds specified user to specified course
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends back a JSON object.
 */
export function addCourseToUser(req,res){
    User.findOne({'email': req.params.student_email}, (err, userobj) => {
        if (err) {
            res.status(500).send(err); 
        }
        else{                   
            Course.findOne({'course_num': req.params.course_num}, (err, courseobj) => {
                var alreadyEnrolled = false;
                if (err) {
                    res.status(500).send(err);
                }
                else{
                    if (courseobj) {            
                        var course_info = {
                                            course_id:    courseobj.id,
                                            course_num:   courseobj.course_num,
                                            course_role:  req.body.course_role
                                        }
                        userobj.courses.forEach((course) => {
                            if (course.course_num == course_info.course_num){
                                alreadyEnrolled = true;
                            }
                        });
                        if (alreadyEnrolled){
                            res.status(500).send({Status: 500, Message: 'User is already enrolled in course!'});  
                        } 
                        else {
                            userobj.courses.addToSet(course_info);
                            userobj.save((err, updateduserobj) => {
                                if (err) res.status(500).send(err);                
                                else res.status(200).send({Status: 200, Message: 'Successfully added '+userobj.email+' to '+courseobj.display_name});
                            });
                        }
                    }
                    else{
                        res.status(404).send({Status: 404, Message: 'Sorry, unable to find that course'});                              
                    }
                }
            });
        }
    });
}

/**
 * Adds specified user to specific section in course
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends back a JSON object.
 */
export function addUserToSection(req,res){
    User.findOne({'email': req.params.student_email}, (err, userobj) => {
        if (err) {
            res.status(500).send(err);    
        }
        else{                
            Course.findOne({'course_num': req.params.course_num}, (err, courseobj) => {
                var isInSection = false;
                if (err) {
                    res.status(500).send(err);
                }
                if (!courseobj || !userobj) {
                    res.status(404).send({Status: 404, Message: 'Sorry, unable to find that user and/or course'});  
                }
                else {           
                    courseobj.sections.forEach((section) => {
                        if (section.name == req.params.section_name){
                            userobj.courses.forEach((course) => {
                                if (course.course_num == req.params.course_num){
                                    course.section_id = section.id;
                                    course.section_name = section.name;
                                    isInSection = true;
                                    userobj.save((err, updateduserobj) => {
                                        if (err) res.status(500).send(err);                
                                        else res.status(200).send({Status: 200, Message: 'Successfully added '+userobj.email+' to '+section.name});
                                    });
                                }
                            });
                        }
                    });
                    if (!isInSection) res.status(500).send({Status: 500, Message: 'Sorry, unable to add user to that section'});  
                }
            });
        } 
    });
}

export function removeUserFromSection(req, res){
    User.findOne({'email': req.params.student_email}, (err, userobj) => {
        var inSection = false;
        if (err) {
            res.status(500).send(err);    
        }
        else{                
            if (!userobj) {
                res.status(404).send({Status: 404, Message: 'Sorry, unable to find that user'});  
            }
            else {
                userobj.courses.forEach((course) => {
                    if (course.section_name == req.params.section_name){
                        course.section_name = undefined;
                        course.section_id = undefined;
                        inSection = true;
                        userobj.save((err, updateduserobj) => {
                            if (err) res.status(500).send(err);                
                            else res.status(200).send({Status: 200, Message: 'Successfully removed '+userobj.email+' from '+req.params.section_name});
                        });
                    }
                });
                if (!inSection) res.status(500).send({Status: 500, Message: 'Sorry, unable to remove user from that section'});
            } 
        } 
    });
}

/**
 * Removes a specified user from specified course
 * @param req : User's request
 * @param res : The response back to the caller.
 * Sends back a JSON object.
 */

export function removeCourseFromUser(req,res){
    User.findOne({'email': req.params.student_email}, (err, userobj) => {
        var isEnrolled = false;        
        if (err) {
            res.status(500).send(err);
        }
        else{
            if (userobj) {
                userobj.courses.forEach((course) => {
                    if (course.course_num == req.params.course_num){
                        isEnrolled = true;
                        var index = userobj.courses.indexOf(course);
                        userobj.courses.splice(index,1);
                        userobj.save((err, updateduserobj) => {
                            if (err) return res.status(500).send(err);                
                            else res.status(200).send({Status: 200, Message: 'Successfully removed '+userobj.email+' from '+course.course_num});
                        });            
                    }
                });
            }
            else{
                return res.status(404).send({Status: 404, Message: 'Sorry, unable to find that user'});   
            }
        }
        if(!isEnrolled) res.status(500).send({Status: 500, Message: 'Sorry, unable to remove user from course'});                                      
    });
}

export function importRoster(req, res){

}