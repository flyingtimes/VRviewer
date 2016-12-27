// 引入 gulp
var gulp = require('gulp');
 
// 引入组件
var
    uglify = require('gulp-uglify'),//js压缩
    concat = require('gulp-concat'),//文件合并
    rename = require('gulp-rename'),//文件更名
    notify = require('gulp-notify');//提示信息
var obfuscate = require('gulp-obfuscate');
 
 
// 合并、压缩js文件
gulp.task('js', function() {
  return gulp.src(['threejs/three.js','helperjs/*.js','js/*.js'])
    .pipe(concat('VRviewer.js')) 
    .pipe(gulp.dest('dest/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dest/js'))
    .pipe(notify({ message: 'js task ok' }));
});
 
// 默认任务
gulp.task('default', function(){
  gulp.run('js');
 
});
