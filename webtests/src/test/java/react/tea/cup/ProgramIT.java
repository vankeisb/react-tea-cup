package react.tea.cup;

import com.pojosontheweb.selenium.ManagedDriverJunit4TestBase;

import org.junit.Test;
import static com.pojosontheweb.selenium.Findrs.textEquals;

public class ProgramIT extends ManagedDriverJunit4TestBase {

    private String baseUrl = System.getProperty("webtests.base.url", "http://localhost:5173");

    @Test
    public void testProgram() {
        getWebDriver().get(baseUrl + "/program-test.html");
        $$("#myid")
                .expectOne()
                .where(textEquals("ID = myid,has dims : {\"w\":200,\"h\":30}"))
                .eval();
    }

}
