source_suffix = '.rst'
master_doc = 'index'
exclude_patterns = ['_build']
extensions = ['sphinxcontrib.httpdomain']

project = u'AURA'
copyright = u'2014, Adrian Sampson'

version = '0.2'
release = '0.2.0'

html_theme = 'default'

# HTTP domain config.
primary_domain = 'http'
http_index_shortname = 'reference'
http_index_localname = 'API Reference'
http_index_ignore_prefixes = ['/aura']
