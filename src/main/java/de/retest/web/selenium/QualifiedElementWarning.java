package de.retest.web.selenium;

import de.retest.recheck.ui.descriptors.Element;
import de.retest.recheck.ui.diff.ElementIdentificationWarning;
import lombok.Value;

@Value
public class QualifiedElementWarning {

	private Element actual;
	private String attributeKey;
	private ElementIdentificationWarning warning;

}
