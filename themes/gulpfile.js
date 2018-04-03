var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('hello', function(){

    console.log('Hello Zell');
});

gulp.task('sass', function(){
    return gulp.src('custom/blog/scss/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('custom/blog/css'))
});

gulp.task('watch', function(){
  gulp.watch('custom/blog/scss/**/*.scss', ['sass']);
})
