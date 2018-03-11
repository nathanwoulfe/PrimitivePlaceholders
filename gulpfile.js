var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

//script paths
var jsSrc = 'src/**/*.js',
	htmlSrc = 'src/**/*.html',
	appPlugins = '../Plumber/Workflow.Site/App_Plugins/PrimitivePlaceholders',
    dest = 'dist/PrimitivePlaceholders';	

gulp.task('js', function() {
    return gulp.src(jsSrc)
		.pipe(babel())
        .pipe(concat('primitive-placeholders.js'))
        .pipe(gulp.dest(dest))
		.pipe(rename('primitive-placeholders.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('html', function() {
	return gulp.src(htmlSrc)
		.pipe(gulp.dest(dest));
});

gulp.task('export', function() {
	return gulp.src(dest + '/**/*')
		.pipe(gulp.dest(appPlugins));
});

gulp.task('build', ['js', 'html', 'export']);