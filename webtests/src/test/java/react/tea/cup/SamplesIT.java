package react.tea.cup;

import com.pojosontheweb.selenium.Findr;
import com.pojosontheweb.selenium.ManagedDriverJunit4TestBase;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebElement;

import java.util.function.Consumer;

import static com.pojosontheweb.selenium.Findrs.textEquals;
import static org.junit.Assert.assertEquals;

public class SamplesIT extends ManagedDriverJunit4TestBase {

    private String baseUrl = System.getProperty("webtests.base.url", "http://localhost:3000");

    @Before
    public void navigateToSamples() {
        getWebDriver().get(baseUrl);
        $$("a").where(textEquals("samples")).expectOne().click();
    }

    @Test
    public void testCounter() {
        Consumer<Integer> assertCounter = i -> $("#counter-value").where(textEquals(Integer.toString(i))).eval();
        Findr buttonSub = $("#counter-sub");
        Findr buttonAdd = $("#counter-add");

        assertCounter.accept(0);
        buttonAdd.click();
        assertCounter.accept(1);
        buttonAdd.click();
        buttonAdd.click();
        assertCounter.accept(3);
        buttonSub.click();
        assertCounter.accept(2);
    }

    @Test
    public void testRaf() {

        getWebDriver().get(baseUrl + "/samples#sample-raf");

        Findr button = $("#raf-start");
        Findr time1 = $("#raf-time-1");
        Findr time2 = $("#raf-time-2");

        time1.where(textEquals("0")).eval();
        time2.where(textEquals("0")).eval();
        button.click();

        // sleep to let RAF do its magic for some time...
        try {
            Thread.sleep(1000);
        }catch (Exception e) {
        }

        button.click();
        String t1 = time1.eval(WebElement::getText);
        String t2 = time2.eval(WebElement::getText);
        assertEquals(t1, t2);
    }

    @Test
    public void testEvents() {
        getWebDriver().get(baseUrl + "/samples#sample-events");

        Findr waitForClick = $$(".wait-for-click").expectOne();
        waitForClick.eval();
        waitForClick.click();

        $$(".view-mouse-pos .vmp-title")
                .where(textEquals("Clicked"))
                .expectOne()
                .eval();

        Findr resizedLeft = $("#resized-left");
        Findr resizedRight = $("#resized-right");

        Consumer<Integer> assertResizes = i -> {
            resizedLeft.where(textEquals(Integer.toString(i))).eval();
            resizedRight.where(textEquals(Integer.toString(i))).eval();
        };

        assertResizes.accept(0);

        Dimension d = getWebDriver().manage().window().getSize();
        Dimension d2 = new Dimension(d.width, d.height + 1);
        getWebDriver().manage().window().setSize(d2);

        assertResizes.accept(1);
    }

}
