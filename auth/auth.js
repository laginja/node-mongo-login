module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'You need to be logged in to view this resource');
        res.redirect('/users/login');
    }, 
    ensureNotAuthenticated: (req, res, next) => {
        if(!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/dashboard');
    }
}
