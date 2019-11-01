package de.retest.web;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class YamlAttributesProvider implements AttributesProvider {

	public static final String ATTRIBUTES_FILE_PROPERTY = "de.retest.recheck.web.attributesFile";
	public static final String DEFAULT_ATTRIBUTES_FILE_PATH = "/attributes.yaml";

	private static final Logger logger = LoggerFactory.getLogger( YamlAttributesProvider.class );

	private static YamlAttributesProvider instance;

	private final YamlAttributesConfig attributesConfig;

	private YamlAttributesProvider() {
		attributesConfig = readAttributesConfig();
	}

	public static YamlAttributesProvider getInstance() {
		if ( instance == null ) {
			instance = new YamlAttributesProvider();
		}
		return instance;
	}

	static YamlAttributesProvider getTestInstance() {
		logger.warn( "A test instance of {} is being used.", YamlAttributesProvider.class.getSimpleName() );
		return new YamlAttributesProvider();
	}

	private YamlAttributesConfig readAttributesConfig() {
		final String userAttributesFilePath = System.getProperty( ATTRIBUTES_FILE_PROPERTY );
		if ( userAttributesFilePath != null ) {
			final Path userAttributes = Paths.get( userAttributesFilePath );
			logger.debug( "Loading user-defined attributes file '{}'.", userAttributes );
			try ( final InputStream in = Files.newInputStream( userAttributes ) ) {
				return readAttributesConfigFromFile( in );
			} catch ( final IOException e ) {
				throw new UncheckedIOException( "Cannot read attributes file '" + userAttributesFilePath + "'.", e );
			}
		} else {
			logger.debug( "Loading default attributes file '{}'", DEFAULT_ATTRIBUTES_FILE_PATH );
			try ( final InputStream url = getClass().getResourceAsStream( DEFAULT_ATTRIBUTES_FILE_PATH ) ) {
				return readAttributesConfigFromFile( url );
			} catch ( final IOException e ) {
				throw new UncheckedIOException( "Cannot read attributes file '" + DEFAULT_ATTRIBUTES_FILE_PATH + "'.",
						e );
			}
		}
	}

	private YamlAttributesConfig readAttributesConfigFromFile( final InputStream in ) throws IOException {
		final ObjectMapper mapper = new ObjectMapper( new YAMLFactory() );
		return mapper.readValue( in, YamlAttributesConfig.class );
	}

	@Override
	public Set<String> getHtmlAttributes() {
		return attributesConfig.getHtmlAttributes();
	}

	@Override
	public boolean allHtmlAttributes() {
		return attributesConfig.allHtmlAttributes();
	}

}
